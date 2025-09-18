/**
 * Base class providing pipe functionality for functional composition.
 * Any class extending this will inherit pipe capabilities.
 */
export abstract class Pipeable {
  protected constructor() {
    // Base constructor for pipeable functionality
  }

  /** Pipe method for left-to-right function composition */
  pipe<T1>(fn1: (collection: this) => T1): T1;
  pipe<T1, T2>(fn1: (collection: this) => T1, fn2: (value: T1) => T2): T2;
  pipe<T1, T2, T3>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3
  ): T3;
  pipe<T1, T2, T3, T4>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4
  ): T4;
  pipe<T1, T2, T3, T4, T5>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5
  ): T5;
  pipe<T1, T2, T3, T4, T5, T6>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6
  ): T6;
  pipe<T1, T2, T3, T4, T5, T6, T7>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7
  ): T7;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8
  ): T8;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9
  ): T9;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10
  ): T10;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11
  ): T11;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11,
    fn12: (value: T11) => T12
  ): T12;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11,
    fn12: (value: T11) => T12,
    fn13: (value: T12) => T13
  ): T13;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11,
    fn12: (value: T11) => T12,
    fn13: (value: T12) => T13,
    fn14: (value: T13) => T14
  ): T14;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11,
    fn12: (value: T11) => T12,
    fn13: (value: T12) => T13,
    fn14: (value: T13) => T14,
    fn15: (value: T14) => T15
  ): T15;
  pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(
    fn1: (collection: this) => T1,
    fn2: (value: T1) => T2,
    fn3: (value: T2) => T3,
    fn4: (value: T3) => T4,
    fn5: (value: T4) => T5,
    fn6: (value: T5) => T6,
    fn7: (value: T6) => T7,
    fn8: (value: T7) => T8,
    fn9: (value: T8) => T9,
    fn10: (value: T9) => T10,
    fn11: (value: T10) => T11,
    fn12: (value: T11) => T12,
    fn13: (value: T12) => T13,
    fn14: (value: T13) => T14,
    fn15: (value: T14) => T15,
    fn16: (value: T15) => T16
  ): T16;
  pipe(...fns: ((value: any) => any)[]): any {
    return fns.reduce((value, fn) => fn(value), this);
  }
}
