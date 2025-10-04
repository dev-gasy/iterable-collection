export interface Key {
  readonly rootId: string;
  readonly revisionNo: number;
  readonly id?: string;
}

export interface BusinessEntity {
  readonly _key: Key;
  readonly name?: string;
}

export interface EntityConstructor<
  TData extends BusinessEntity,
  TParent extends BusinessEntity,
  TInstance = unknown
> {
  new (value?: TData, parent?: TParent): TInstance;
}

export interface CollectionConstructor<
  TData extends BusinessEntity,
  TParent extends BusinessEntity,
  TInstance = unknown
> {
  new (values: readonly TData[], parent?: TParent): TInstance;
}

// Advanced TypeScript utility types for enhanced type safety
export type NonEmptyArray<T> = readonly [T, ...T[]];

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickRequired<T> = Pick<T, RequiredKeys<T>>;
export type PickOptional<T> = Pick<T, OptionalKeys<T>>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type EntityWithValue<TData extends BusinessEntity> = {
  readonly value: TData;
  exists(): true;
  isEmpty(): false;
  raw(): TData;
};

export type EmptyEntity = {
  readonly value?: undefined;
  exists(): false;
  isEmpty(): true;
  raw(): undefined;
};

// Template literal types for better entity naming
export type EntityName<T extends string> = `${T}Entity`;
export type CollectionName<T extends string> = `${T}Collection`;

// Conditional types for entity operations
export type EntityState<T extends BusinessEntity | undefined> = T extends BusinessEntity
  ? EntityWithValue<T>
  : EmptyEntity;

// Mapped types for transforming entity collections
export type EntityMap<T extends Record<string, BusinessEntity>> = {
  readonly [K in keyof T]: EntityWithValue<T[K]>;
};

// Utility type for extracting entity data from collections
export type ExtractEntityData<T> = T extends { raw(): readonly (infer U)[] }
  ? U extends BusinessEntity
    ? U
    : never
  : never;

// Brand types for type safety
declare const __brand: unique symbol;
export type Brand<T, B> = T & { readonly [__brand]: B };

export type EntityId = Brand<string, 'EntityId'>;
export type RootId = Brand<string, 'RootId'>;
export type RevisionNo = Brand<number, 'RevisionNo'>;
