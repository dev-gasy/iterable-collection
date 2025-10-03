import { produce, type Draft } from "immer";
import type { BusinessEntity, EntityConstructor } from "./types.ts";
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

  public exists(): boolean {
    return this.value !== undefined;
  }

  public isEmpty(): boolean {
    return this.value === undefined;
  }

  public raw(): TData | undefined {
    return this.value;
  }

  public update(updater: (draft: Draft<TData>) => void): this {
    if (!this.value) {
      return this;
    }

    return new (this.constructor as EntityConstructor<TData, TParent, this>)(
      produce(this.value, updater),
      this.parent
    );
  }

  public copy(): this {
    return new (this.constructor as EntityConstructor<TData, TParent, this>)(
      this.value,
      this.parent
    );
  }
}
