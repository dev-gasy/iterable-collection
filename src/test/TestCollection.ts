import { Entity } from "../collection/Entity";
import { IterableCollection } from "../collection/IterableCollection";
import type { BusinessEntity } from "../collection/types";

export interface TestData extends BusinessEntity {
  name: string;
}

export class TestEntity extends Entity<TestData> {}

export class TestCollection extends IterableCollection<
  TestData,
  TestEntity,
  BusinessEntity
> {
  protected createEntity(data?: TestData): TestEntity {
    return new TestEntity(data);
  }
}
