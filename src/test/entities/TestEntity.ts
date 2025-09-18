import { Entity } from "../../model/Entity";
import { Collection } from "../../model/Collection";
import type { BusinessEntity } from "../../model/types";

// Test Data Type for basic IterableEntities tests
export interface TestData extends BusinessEntity {
  name: string;
}

export class TestEntity extends Entity<TestData, BusinessEntity> {
  getName(): string {
    return this.raw()?.name ?? "Unknown";
  }
}

export class TestCollection extends Collection<
  TestData,
  TestEntity,
  BusinessEntity
> {
  protected createEntity(data?: TestData): TestEntity {
    return new TestEntity(data, this.parent);
  }
}
