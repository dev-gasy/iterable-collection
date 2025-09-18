export interface Key {
  readonly rootId: string;
  readonly revisionNo: number;
  readonly id?: string;
}

export interface BusinessEntity {
  readonly _key: Key;
  readonly name?: string;
}
