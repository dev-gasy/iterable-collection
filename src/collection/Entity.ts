import type { BusinessEntity } from "./types.ts";

export class Entity<
  TData extends BusinessEntity,
  TParent extends BusinessEntity = BusinessEntity
> {
  protected value?: TData;
  protected parent?: TParent;

  public constructor(value?: TData, parent?: TParent) {
    this.value = Object.freeze(value);
    this.parent = Object.freeze(parent);
  }

  public id(): string | undefined {
    return this.value?._key?.id;
  }

  public raw(): TData | undefined {
    return this.value;
  }
}
