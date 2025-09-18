import type { BusinessEntity } from "./types.ts";
import { Pipeable } from "./Pipeable.ts";

export class Entity<
  TData extends BusinessEntity,
  TParent extends BusinessEntity = BusinessEntity
> extends Pipeable {
  protected value?: TData;
  protected parent?: TParent;

  public constructor(value?: TData, parent?: TParent) {
    super();
    this.value = Object.freeze(value);
    this.parent = Object.freeze(parent);
  }

  public get name() {
    return this.value?.name;
  }

  public id(): string | undefined {
    return this.value?._key?.id;
  }

  public raw(): TData | undefined {
    return this.value;
  }
}
