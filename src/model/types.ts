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
