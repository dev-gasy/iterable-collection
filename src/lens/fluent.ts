// Advanced fluent navigation utilities with improved type inference
type Nullable<T> = T | null | undefined;

// Helper type to extract array element type
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Helper type to get property type safely
type SafeGet<T, K extends PropertyKey> = T extends object
  ? K extends keyof T
    ? T[K]
    : unknown
  : unknown;

// Helper type to check if T is an array and get element type
type SafeArrayElement<T> = T extends readonly (infer U)[]
  ? U
  : T extends null | undefined
    ? never
    : unknown;

// Core fluent navigator class with enhanced type inference
class FluentNavigator<T> {
    private readonly data: T;

    constructor(data: T) {
        this.data = data;
    }

    // Get property with enhanced type safety
    get<K extends PropertyKey>(
        key: K
    ): FluentNavigator<SafeGet<NonNullable<T>, K> | null> {
        if (this.data == null) {
            return new FluentNavigator(null);
        }

        const obj = this.data as Record<PropertyKey, any>;
        return new FluentNavigator(obj[key] ?? null);
    }

    // Get array element with enhanced type inference
    at<U = SafeArrayElement<NonNullable<T>>>(
        index: number
    ): FluentNavigator<U | null> {
        if (this.data == null || !Array.isArray(this.data)) {
            return new FluentNavigator(null);
        }

        const array = this.data as U[];
        if (index < 0 || index >= array.length) {
            return new FluentNavigator(null);
        }

        return new FluentNavigator(array[index] ?? null);
    }

    // Transform the current value
    transform<R>(
        transformer: (input: NonNullable<T>) => R
    ): FluentNavigator<R | null> {
        if (this.data == null) {
            return new FluentNavigator(null);
        }

        try {
            return new FluentNavigator(transformer(this.data as NonNullable<T>));
        } catch {
            return new FluentNavigator(null);
        }
    }

    // Filter array elements with enhanced type inference
    filter<U = SafeArrayElement<NonNullable<T>>>(
        predicate: (item: U, index: number) => boolean
    ): FluentNavigator<U[]> {
        if (this.data == null || !Array.isArray(this.data)) {
            return new FluentNavigator([]);
        }

        const array = this.data as U[];
        return new FluentNavigator(array.filter(predicate));
    }

    // Find array element with enhanced type inference
    find<U = SafeArrayElement<NonNullable<T>>>(
        predicate: (item: U, index: number) => boolean
    ): FluentNavigator<U | null> {
        if (this.data == null || !Array.isArray(this.data)) {
            return new FluentNavigator(null);
        }

        const array = this.data as U[];
        const found = array.find(predicate);
        return new FluentNavigator(found ?? null);
    }

    // Map over array elements with enhanced type inference
    map<U = SafeArrayElement<NonNullable<T>>, R = unknown>(
        mapper: (item: U, index: number) => R
    ): FluentNavigator<R[]> {
        if (this.data == null || !Array.isArray(this.data)) {
            return new FluentNavigator([]);
        }

        const array = this.data as U[];
        return new FluentNavigator(array.map(mapper));
    }

    // Check if value exists
    exists(): boolean {
        return this.data != null;
    }

    // Check if value exists and matches predicate
    existsWhere(predicate: (value: NonNullable<T>) => boolean): boolean {
        if (this.data == null) {
            return false;
        }
        try {
            return predicate(this.data as NonNullable<T>);
        } catch {
            return false;
        }
    }

    // Get value or default
    or(defaultValue: NonNullable<T>): NonNullable<T> {
        return this.data == null ? defaultValue : (this.data as NonNullable<T>);
    }

    // Get the raw value
    getValue(): T {
        return this.data;
    }

    // Execute side effect if value exists
    tap(fn: (value: NonNullable<T>) => void): FluentNavigator<T> {
        if (this.data != null) {
            try {
                fn(this.data as NonNullable<T>);
            } catch {
                // Ignore errors in side effects
            }
        }
        return this;
    }

    // String representation
    toString(): string {
        return String(this.data ?? 'null');
    }
}

// Factory function to create navigator
export function navigate<T>(data: T): FluentNavigator<T> {
    return new FluentNavigator(data);
}

// Alias for shorter syntax
export const $ = navigate;

// Export the FluentNavigator class
export { FluentNavigator };

// Export type utilities
export type { Nullable, ArrayElement, SafeGet, SafeArrayElement };