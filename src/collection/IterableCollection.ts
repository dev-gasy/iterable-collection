import type { Entity } from "./Entity.ts";
import type { BusinessEntity } from "./types.ts";

/**
 * Minimal fluent immutable iterable collection of entities.
 */
export abstract class IterableCollection<
  TData extends BusinessEntity,
  TEntity extends Entity<TData, TParent>,
  TParent extends BusinessEntity
> implements Iterable<TEntity>
{
  protected readonly items: readonly TData[];
  protected readonly parent?: TParent;

  constructor(items: readonly TData[] = [], parent?: TParent) {
    this.items = Object.freeze([...items]);
    this.parent = parent;
  }

  /** Clone factory */
  create(items: readonly TData[]): this {
    return new (this.constructor as new (
      items: readonly TData[],
      parent?: TParent
    ) => this)(items, this.parent);
  }

  /** Access */
  at(index: number): TEntity {
    return this.createEntity(this.items[index]);
  }

  get length(): number {
    return this.items.length;
  }

  toArray(): TEntity[] {
    return [...this];
  }

  toDataArray(): readonly TData[] {
    return this.items;
  }

  /** Fluent mutators */
  push(item: TData): this {
    return this.create([...this.items, item]);
  }

  filter(predicate: (entity: TEntity, index: number) => boolean): this {
    return this.create(
      this.items.filter((d, i) => predicate(this.createEntity(d), i))
    );
  }

  map<U>(mapper: (entity: TEntity, index: number) => U): U[] {
    return this.items.map((d, i) => mapper(this.createEntity(d), i));
  }

  /** Iteration */
  *[Symbol.iterator](): Generator<TEntity, void, unknown> {
    for (let i = 0; i < this.length; i++) {
      yield this.at(i);
    }
  }

  /** Subclass must define how to create entity wrappers */
  protected abstract createEntity(data: TData): TEntity;
}
