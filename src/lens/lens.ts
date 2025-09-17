// High-performance lens-based data access utilities
type Lens<S, A> = {
  get: (s: S) => A | null;
  set: (s: S, a: A) => S;
  modify: (s: S, f: (a: A) => A) => S;
};

// Simplified type helpers
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
type DeepNullable<T> = T | null | undefined;

// High-performance lens creation with minimal overhead
export function lens<S, A>(
  getter: (s: S) => A | null,
  setter: (s: S, a: A) => S
): Lens<S, A> {
  const modify = (s: S, f: (a: A) => A) => {
    const current = getter(s);
    return current !== null ? setter(s, f(current)) : s;
  };
  
  return { get: getter, set: setter, modify };
}

// Optimized property lens with direct property access
export function prop<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return {
    get: (s: S) => (s != null && s[key] !== undefined ? s[key] : null),
    set: (s: S, a: S[K]) => (s == null ? { [key]: a } as S : { ...s, [key]: a }),
    modify: (s: S, f: (a: S[K]) => S[K]) => {
      if (s == null) return s;
      const current = s[key];
      return current !== undefined ? { ...s, [key]: f(current) } : s;
    }
  };
}

// Fast safe property lens
export function safeProp<S, K extends PropertyKey>(key: K): Lens<S, any> {
  return {
    get: (s: S) => {
      if (s == null) return null;
      const value = (s as any)[key];
      return value !== undefined ? value : null;
    },
    set: (s: S, a: any) => (s == null ? { [key]: a } as S : { ...s as any, [key]: a }),
    modify: (s: S, f: (a: any) => any) => {
      if (s == null) return s;
      const current = (s as any)[key];
      return current !== undefined ? { ...s as any, [key]: f(current) } : s;
    }
  };
}

// High-performance array index lens
export function index<T>(i: number): Lens<T[], T> {
  return {
    get: (arr: T[]) => (Array.isArray(arr) && i >= 0 && i < arr.length ? arr[i] : null),
    set: (arr: T[], item: T) => {
      if (!Array.isArray(arr)) return [item];
      const newArr = arr.slice(); // Faster than spread for large arrays
      newArr[i] = item;
      return newArr;
    },
    modify: (arr: T[], f: (a: T) => T) => {
      if (!Array.isArray(arr) || i < 0 || i >= arr.length) return arr;
      const newArr = arr.slice();
      newArr[i] = f(arr[i]);
      return newArr;
    }
  };
}

// Optimized safe array index lens
export function safeIndex<T>(i: number): Lens<DeepNullable<T[]>, T> {
  return {
    get: (arr: DeepNullable<T[]>) => 
      (Array.isArray(arr) && i >= 0 && i < arr.length ? arr[i] : null),
    set: (arr: DeepNullable<T[]>, item: T) => {
      if (!Array.isArray(arr)) return [item];
      const newArr = arr.slice();
      newArr[i] = item;
      return newArr;
    },
    modify: (arr: DeepNullable<T[]>, f: (a: T) => T) => {
      if (!Array.isArray(arr) || i < 0 || i >= arr.length) return arr;
      const newArr = arr.slice();
      newArr[i] = f(arr[i]);
      return newArr;
    }
  };
}

// Fast find lens with early termination
export function find<T>(predicate: (item: T) => boolean): Lens<T[], T> {
  return {
    get: (arr: T[]) => {
      if (!Array.isArray(arr)) return null;
      for (let i = 0; i < arr.length; i++) {
        if (predicate(arr[i])) return arr[i];
      }
      return null;
    },
    set: (arr: T[], item: T) => {
      if (!Array.isArray(arr)) return [item];
      for (let i = 0; i < arr.length; i++) {
        if (predicate(arr[i])) {
          const newArr = arr.slice();
          newArr[i] = item;
          return newArr;
        }
      }
      return [...arr, item];
    },
    modify: (arr: T[], f: (a: T) => T) => {
      if (!Array.isArray(arr)) return arr;
      for (let i = 0; i < arr.length; i++) {
        if (predicate(arr[i])) {
          const newArr = arr.slice();
          newArr[i] = f(arr[i]);
          return newArr;
        }
      }
      return arr;
    }
  };
}

// Optimized lens composition with minimal function calls
export function compose<S, A, B>(lens1: Lens<S, A>, lens2: Lens<A, B>): Lens<S, B> {
  return {
    get: (s: S) => {
      const a = lens1.get(s);
      return a !== null ? lens2.get(a) : null;
    },
    set: (s: S, b: B) => {
      const a = lens1.get(s);
      return a !== null ? lens1.set(s, lens2.set(a, b)) : s;
    },
    modify: (s: S, f: (b: B) => B) => {
      const a = lens1.get(s);
      if (a !== null) {
        const b = lens2.get(a);
        if (b !== null) {
          return lens1.set(s, lens2.set(a, f(b)));
        }
      }
      return s;
    }
  };
}

// Simplified high-performance lens operations
export class LensOps<S, A> {
  private readonly source: S;
  private readonly lens: Lens<S, A>;
  
  constructor(source: S, lens: Lens<S, A>) {
    this.source = source;
    this.lens = lens;
  }

  // Inline get for better performance
  get(): A | null {
    return this.lens.get(this.source);
  }

  // Fast getOr with single call
  getOr<D>(defaultValue: D): A | D {
    const value = this.lens.get(this.source);
    return value !== null ? value : defaultValue;
  }

  // Direct set operation
  set(value: A): S {
    return this.lens.set(this.source, value);
  }

  // Direct modify operation
  modify(f: (a: A) => A): S {
    return this.lens.modify(this.source, f);
  }

  // Single null check for exists
  exists(): boolean {
    return this.lens.get(this.source) !== null;
  }

  // Optimized focus with pre-composed lens
  focus<B>(newLens: Lens<A, B>): LensOps<S, B> {
    return new LensOps(this.source, compose(this.lens, newLens));
  }

  // Fast property access
  prop<K extends keyof NonNullable<A>>(key: K): LensOps<S, NonNullable<A>[K]> {
    return this.focus(prop<NonNullable<A>, K>(key) as Lens<A, NonNullable<A>[K]>);
  }

  // Fast safe property access
  safeProp<K extends PropertyKey>(key: K): LensOps<S, any> {
    return this.focus(safeProp<A, K>(key));
  }

  // Fast array access
  at<T>(index: number): LensOps<S, T> {
    return this.focus(safeIndex<T>(index) as unknown as Lens<A, T>);
  }

  // Fast find with type inference
  findItem<T>(predicate: (item: T) => boolean): LensOps<S, T> {
    return this.focus(find<T>(predicate) as unknown as Lens<A, T>);
  }

  // Single-call map
  map<B>(f: (a: A) => B): B | null {
    const value = this.lens.get(this.source);
    return value !== null ? f(value) : null;
  }

  // Single-call filter
  filter(predicate: (a: A) => boolean): A | null {
    const value = this.lens.get(this.source);
    return value !== null && predicate(value) ? value : null;
  }

  // Side effect with single get
  tap(f: (a: A) => void): LensOps<S, A> {
    const value = this.lens.get(this.source);
    if (value !== null) f(value);
    return this;
  }

  // Fast transform with minimal overhead
  transform<B>(transformer: (a: A) => B): LensOps<S, B> {
    return this.focus({
      get: (a: A) => a !== null ? transformer(a) : null,
      set: (_, b: B) => b as any,
      modify: (_, f: (b: B) => B) => f as any
    });
  }
}

// Fast factory function with identity lens
export function view<S>(source: S): LensOps<S, S> {
  return new LensOps(source, { 
    get: s => s, 
    set: (_, a) => a, 
    modify: (_, f) => f 
  } as Lens<S, S>);
}

// Simplified lens builders for common operations
export const L = {
  // Direct property access
  prop: prop,
  
  // Safe property access
  safeProp: safeProp,
  
  // Array access
  at: safeIndex,
  
  // Array find
  find: find,
  
  // Compose lenses
  compose: compose,
  
  // Create custom lens
  lens: lens,
  
  // Identity lens with minimal overhead
  id: <T>(): Lens<T, T> => ({ 
    get: s => s, 
    set: (_, a) => a, 
    modify: (_, f) => f(null as any) 
  }),
};

// Export optimized types and functions
export type { Lens, ArrayElement, DeepNullable };
export { view as from };