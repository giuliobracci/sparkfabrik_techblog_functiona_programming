import * as readline from "readline";
import { match } from "ts-pattern";
import { Key } from "readline";
import { IO } from "./lib/monads/IO";
import { stdin } from "process";

type Direction = "up" | "down";
type Option = { label: string; value: string; selected: boolean };
type Value = Pick<Option, "value">;
type State = { selected: Value[]; step: number; steps: Array<Option[]> };
type Action = Move | Exit | Noop | Select;
type Move = { type: "move"; payload: { direction: Direction } };
type Select = { type: "select" };
type Exit = { type: "exit" };
type Noop = { type: "noop" };

const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

const wrapInRange = (index: number, length: number): number => ((index % length) + length) % length;
const colorize = (text: string, color: string): string => {
  return `${color}${text}${Colors.Reset}`;
};

const move = ({ step, steps, ...rest }: State, direction: Direction): State => {
  const currentIndex = steps[step].findIndex((o) => o.selected);
  const newIndex = wrapInRange(
    direction === "down" ? currentIndex + 1 : currentIndex - 1,
    steps[step].length
  );

  return {
    ...rest,
    step,
    steps: [
      ...steps.slice(0, step),
      steps[step].map((o, i) => ({ ...o, selected: i === newIndex })),
      ...steps.slice(step + 1),
    ],
  };
};

const exit = (state: State) => {
  process.exit(0);
  return state;
};

const select = (state: State) => {
  const selected = state.steps[state.step].find((o) => o.selected);
  if (selected) {
    state.selected.push({ value: selected.value });
  }
  state.step += 1;
  return state;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "move":
      return move(state, action.payload.direction);
    case "exit":
      return exit(state);
    case "select":
      return select(state);
    case "noop":
    default:
      return state;
  }
};

const createAction = (key: Key): Action =>
  match(key)
    .with({ name: "up" }, (): Move => ({ type: "move", payload: { direction: "up" } }))
    .with({ name: "down" }, (): Move => ({ type: "move", payload: { direction: "down" } }))
    .with({ name: "c", ctrl: true }, (): Exit => ({ type: "exit" }))
    .with({ name: "return" }, (): Select => ({ type: "select" }))
    .with({ name: "space" }, (): Select => ({ type: "select" }))
    .otherwise((): Noop => ({ type: "noop" }));

const getUI = (state: State): string =>
  state.steps[state.step]
    .map(
      (option) =>
        `${option.selected ? "✨" : " "} ${
          option.selected ? colorize(option.label, Colors.FgCyan) : option.label
        }`
    )
    .join("\n");

export const App = (initialState: State) => {
  let state = initialState;

  const keyHandler = (currentState: State, key: Key): IO<void> =>
    IO(() => {
      const action = createAction(key);
      const nextState = reducer(currentState, action);
      return nextState;
    }).map((nextState) => {
      state = nextState;
    });

  const greeting = IO(() => console.log(colorize("Welcome to the app!", Colors.FgBlue)));
  const howToExit = IO(() => console.log(colorize("Press Ctrl+C to exit", Colors.FgRed)));
  const howToSelect = IO(() => console.log(colorize("Press enter to select", Colors.FgCyan)));
  const howToNavigate = IO(() =>
    console.log(colorize("Use the arrow keys to navigate", Colors.FgYellow))
  );

  const instructions = greeting
    .chain(() => howToNavigate)
    .chain(() => howToExit)
    .chain(() => howToSelect);

  const render = IO(() => console.clear())
    .chain(() => instructions)
    .map(() => console.log(`Step ${state.step + 1}`))
    .map(() => console.log(getUI(state)));

  const setup = IO(() => readline.emitKeypressEvents(stdin))
    .map(() => stdin.setRawMode(true))
    .map(() =>
      process.stdin.on("keypress", (_, key) =>
        keyHandler(state, key)
          .chain(() => render)
          .run()
      )
    );

  setup.chain(() => render).run();
};

const initialState: State = {
  selected: [],
  step: 0,
  steps: [
    [
      { label: "Orange", value: "ORANGE", selected: true },
      { label: "Lemon", value: "LEMON", selected: false },
      { label: "Strawberry", value: "STRAWBERRY", selected: false },
    ],
    [
      { label: "Test", value: "TEST", selected: true },
      { label: "Label", value: "LABEL", selected: false },
      { label: "Software", value: "SOFTWARE", selected: false },
    ],
  ],
};

App(initialState);

