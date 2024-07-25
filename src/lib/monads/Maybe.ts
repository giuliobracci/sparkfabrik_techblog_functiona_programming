type Maybe<T> = Just<T> | Nothing;

type Nothing = {
  _tag: "Nothing";
  map<U>(): Maybe<never>;
  flatMap<U>(): Maybe<never>;
};

type Just<T> = {
  _tag: "Just";
  value: NonNullable<T>;
  map<U>(f: (value: T) => U): Maybe<U>;
  flatMap<U>(f: (value: T) => Maybe<U>): Maybe<U>;
};

export const Just = <T>(value: NonNullable<T>): Maybe<T> => {
  return {
    _tag: "Just",
    value: value,
    map: <U>(f: (value: T) => U): Maybe<U> => Maybe(f(value)),
    flatMap: <U>(f: (value: T) => Maybe<U>): Maybe<U> => {
      const result = f(value);
      return result._tag === "Just" ? result : Nothing;
    },
  };
};

export const Nothing: Maybe<never> = {
  _tag: "Nothing",
  map: <U>(): Maybe<U> => Nothing,
  flatMap: <U>(): Maybe<U> => Nothing,
};

export const Maybe = <T>(value: T | null | undefined): Maybe<T> => {
  return value == null ? Nothing : Just<T>(value);
};
