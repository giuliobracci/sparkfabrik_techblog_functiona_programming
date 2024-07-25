type Either<T, U> = Right<T> | Left<U>;

type Left<U> = {
  _tag: "Left";
  value: U;
  map<K>(fn: (value: U) => K): Either<K, never>;
  flatMap<K>(fn: (value: U) => Either<K, never>): Either<U, never>;
};

type Right<U> = {
  _tag: "Right";
  value: U;
  map<T>(fn: (value: U) => T): Either<never, T>;
  flatMap<T>(fn: (value: U) => Either<never, T>): Either<never, T>;
};

const Left = <T>(value: T): Either<T, never> => {
  return {
    _tag: "Left",
    value: value,
    map: <U>(fn: (value: T) => U): Either<U, never> => Left(fn(value)),
    flatMap: <U>(fn: (value: T) => Either<U, never>): Either<U, never> => {
      const result = fn(value);
      return result._tag === "Left" ? result : Left(result.value);
    },
  };
};

const Right = <U>(value: U): Either<never, U> => {
  return {
    _tag: "Right",
    value: value,
    map: <T>(fn: (value: U) => T): Either<never, T> => Right(fn(value)),
    flatMap: <T>(fn: (value: U) => Either<never, T>): Either<never, T> => {
      const result = fn(value);
      return result._tag === "Right" ? result : Right(result.value);
    },
  };
};
