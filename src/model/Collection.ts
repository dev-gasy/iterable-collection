import { produce, type Draft } from "immer";

import type { Entity } from "./Entity.ts";
import type { BusinessEntity } from "./types.ts";
import { Pipeable } from "./Pipeable.ts";

/**
 * Minimal fluent immutable iterable collection of entities.
 */
export abstract class Collection<
    TData extends BusinessEntity,
    TEntity extends Entity<TData, TParent>,
    TParent extends BusinessEntity
  >
  extends Pipeable
  implements Iterable<TEntity>
{
  protected readonly values: readonly TData[];
  protected readonly parent?: TParent;

  /** Constructor */
  constructor(values: readonly TData[] = [], parent?: TParent) {
    super();
    this.values = Object.freeze([...values]);
    this.parent = parent ? Object.freeze(parent) : undefined;
  }

  /** Factory method for cloning with new values */
  protected create(values: readonly TData[]): this {
    return new (this.constructor as new (
      values: readonly TData[],
      parent?: TParent
    ) => this)(values, this.parent);
  }

  /** Access raw immutable values */
  raw(): readonly TData[] {
    return this.values;
  }

  /** Accessors */
  at(index: number): TEntity {
    return this.createEntity(this.values[index]);
  }

  get length(): number {
    return this.values.length;
  }

  get isEmpty(): boolean {
    return this.length === 0;
  }

  toArray(): TEntity[] {
    return this.values.map((v) => this.createEntity(v));
  }

  /** Functional methods */
  filter(predicate: (entity: TEntity, index: number) => boolean): this {
    const items: TData[] = [];
    for (let i = 0; i < this.values.length; i++) {
      const e = this.createEntity(this.values[i]);
      if (predicate(e, i)) items.push(this.values[i]);
    }
    return this.create(items);
  }

  map<U>(mapper: (entity: TEntity, index: number) => U): U[] {
    return this.values.map((v, i) => mapper(this.createEntity(v), i));
  }

  reduce<U>(
    reducer: (accumulator: U, entity: TEntity, index: number) => U,
    initialValue: U
  ): U {
    return this.values.reduce(
      (acc, v, i) => reducer(acc, this.createEntity(v), i),
      initialValue
    );
  }

  /** Immutable update on raw data */
  update(updater: (draft: Draft<TData[]>) => void): this {
    const items = produce(this.values, updater);
    return this.create(items);
  }

  copy(): this {
    return this.create(this.values);
  }

  /** Iteration */
  *[Symbol.iterator](): Generator<TEntity, void, unknown> {
    for (let i = 0; i < this.values.length; i++) {
      yield this.createEntity(this.values[i]);
    }
  }

  /** Abstract method for creating entity from raw data */
  protected abstract createEntity(data: TData): TEntity;
}
