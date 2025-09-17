import type { Entity } from "./Entity";
import type { BusinessEntity } from "./types";

export abstract class IterableCollection<
  TData extends BusinessEntity,
  TEntity extends Entity<TData, TParent>,
  TParent extends BusinessEntity
> {
  declare readonly ["constructor"]: new (
    items: readonly TData[],
    parent?: TParent
  ) => this;

  protected readonly items: readonly TData[];
  protected readonly parent?: TParent;
  protected readonly originals: readonly TData[];

  public constructor(initialItems: readonly TData[] = [], parent?: TParent) {
    this.items = [...initialItems];
    this.parent = parent;
    this.originals = [...initialItems];
  }

  public at(index: number): TEntity {
    return this.createEntity(this.items[index]);
  }

  public get length(): number {
    return this.items.length;
  }

  public push(item: TData): this {
    return new this.constructor([...this.items, item], this.parent);
  }

  public removeAt(index: number): this {
    return new this.constructor(
      this.items.filter((_, i) => i !== index),
      this.parent
    );
  }

  public toArray(): TEntity[] {
      return Array.from(this);
  }

  public *[Symbol.iterator](): Generator<TEntity, void, unknown> {
    for (const item of this.items) {
      yield this.createEntity(item);
    }
  }

  protected abstract createEntity(data?: TData): TEntity;
}
