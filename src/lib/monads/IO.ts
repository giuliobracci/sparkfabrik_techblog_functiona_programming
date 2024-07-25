export type IO<A> = {
  _tag: "IO";
  run: () => A;
  map<B>(f: (a: A) => B): IO<B>;
  chain<B>(f: (a: A) => IO<B>): IO<B>;
  fromPredicate(predicate: () => boolean, ifTrue: () => IO<A>): IO<A>;
};

export const IO = <A>(effect: () => A): IO<A> => ({
  _tag: "IO",
  run: effect,
  map: <B>(f: (a: A) => B): IO<B> => IO(() => f(effect())),
  chain: <B>(f: (a: A) => IO<B>): IO<B> => IO(() => f(effect()).run()),
  fromPredicate: (predicate: () => boolean, ifTrue: () => IO<A>): IO<A> =>
    IO(() => {
      if (predicate()) {
        return ifTrue().run();
      }
      return effect();
    }),
});

