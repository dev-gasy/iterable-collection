import { describe, it, expect } from "vitest";
import { produce } from "immer";

import { any, partial } from "../partial/utils";
import {
  TestEntity,
  TestCollection,
  Vehicle,
  ViolationEntity,
  Driver,
  Party,
  Coverage,
  Quote,
  Violations,
  Vehicles,
  Drivers,
  Parties,
  Coverages,
  Quotes,
  type TestData,
  type QuoteData,
  type VehicleData,
} from "./entities";
import { createEntityTestData } from "./testData";
import { Collection } from "../model/Collection";
import type { BusinessEntity } from "../model/types";

describe("Entities", () => {
  describe("Constructor", () => {
    it("should create empty Entities", () => {
      // Arrange
      // (No setup needed for empty constructor)

      // Act
      const entities = new TestCollection();

      // Assert
      expect(entities.length).toBe(0);
    });

    it("should create Entities with initial items", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];

      // Act
      const entities = new TestCollection(items);

      // Assert
      expect(entities.length).toBe(2);
    });
  });

  describe("Basic Operations", () => {
    it("should return entity at valid index", () => {
      // Arrange
      const item = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const entities = new TestCollection([item]);

      // Act
      const result = entities.at(0);

      // Assert
      expect(result).toBeInstanceOf(TestEntity);
      expect(result?.id()).toBe("1");
    });

    it("should return entity with undefined data for invalid index", () => {
      // Arrange
      const entities = new TestCollection();

      // Act
      const result1 = entities.at(0);
      const result2 = entities.at(-1);

      // Assert
      expect(result1).toBeInstanceOf(TestEntity);
      expect(result1.id()).toBeUndefined();
      expect(result2).toBeInstanceOf(TestEntity);
      expect(result2.id()).toBeUndefined();
    });

    it("should return correct length", () => {
      // Arrange
      const emptyEntities = new TestCollection();
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });

      // Act
      const entitiesAfterFirst = emptyEntities.push(item1);
      const entitiesAfterSecond = entitiesAfterFirst.push(item2);

      // Assert
      expect(emptyEntities.length).toBe(0);
      expect(entitiesAfterFirst.length).toBe(1);
      expect(entitiesAfterSecond.length).toBe(2);
    });
  });

  describe("Iterator", () => {
    it("should iterate over empty Entities", () => {
      // Arrange
      const entities = new TestCollection();

      // Act
      const result = Array.from(entities);

      // Assert
      expect(result).toEqual([]);
    });

    it("should iterate over entities using for...of", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);

      // Act
      const result = [];
      for (const entity of entities) {
        result.push(entity);
      }

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
      expect(result[2]).toBeInstanceOf(TestEntity);
      expect(result[2].id()).toBe("3");
    });

    it("should work with Array.from", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);

      // Act
      const result = Array.from(entities);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should work with spread operator", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);

      // Act
      const result = [...entities];

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should work with manual iterator", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const iterator = entities[Symbol.iterator]();

      // Act & Assert
      let result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("1");

      result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("2");

      result = iterator.next();
      expect(result.done).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe("Mutation Operations", () => {
    it("should return new Entities with added item", () => {
      // Arrange
      const entities = new TestCollection();
      const item = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });

      // Act
      const newEntities = entities.push(item);

      // Assert
      expect(entities.length).toBe(0);
      expect(newEntities.length).toBe(1);
      expect(newEntities.at(0)).toBeInstanceOf(TestEntity);
      expect(newEntities.at(0).id()).toBe("1");
      expect(newEntities).not.toBe(entities);
    });

    it("should support fluent chaining with new instances", () => {
      // Arrange
      const entities = new TestCollection();
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });

      // Act
      const result = entities.push(item1).push(item2);

      // Assert
      expect(result).not.toBe(entities);
      expect(entities.length).toBe(0);
      expect(result.length).toBe(2);
      expect(result.at(0)).toBeInstanceOf(TestEntity);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1)).toBeInstanceOf(TestEntity);
      expect(result.at(1).id()).toBe("2");
    });

    it("should maintain immutability when pushing multiple items", () => {
      // Arrange
      const entities = new TestCollection();
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const item3 = partial<TestData>({ _key: { id: "3" }, name: "Item 3" });

      // Act
      const step1 = entities.push(item1);
      const step2 = step1.push(item2);
      const step3 = step2.push(item3);

      // Assert
      expect(entities.length).toBe(0);
      expect(step1.length).toBe(1);
      expect(step2.length).toBe(2);
      expect(step3.length).toBe(3);
      expect(step1.at(0).id()).toBe("1");
      expect(step2.at(1).id()).toBe("2");
      expect(step3.at(2).id()).toBe("3");
    });
  });

  describe("Insert and Remove Operations", () => {
    it("should insert item at valid index", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = entities.insertAt(1, newItem);

      expect(result.length).toBe(3);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
      expect(result.at(2).id()).toBe("3");
    });

    it("should insert at beginning when index is 0", () => {
      const items = [partial<TestData>({ _key: { id: "2" }, name: "Item 2" })];
      const entities = new TestCollection(items);
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = entities.insertAt(0, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should insert at end when index equals length", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = entities.insertAt(1, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp negative index to 0", () => {
      const items = [partial<TestData>({ _key: { id: "2" }, name: "Item 2" })];
      const entities = new TestCollection(items);
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = entities.insertAt(-5, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp large index to length", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = entities.insertAt(999, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty Entities", () => {
      const entities = new TestCollection();
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = entities.insertAt(0, newItem);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should remove item at valid index", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.removeAt(1);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("3");
    });

    it("should remove first item", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.removeAt(0);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("2");
    });

    it("should remove last item", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.removeAt(1);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should handle negative index in remove", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.removeAt(-1);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should handle index beyond bounds in remove", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const result = entities.removeAt(999);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should work on single item Entities", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const result = entities.removeAt(0);

      expect(result.length).toBe(0);
    });

    it("should work on empty Entities", () => {
      const entities = new TestCollection();
      const result = entities.removeAt(0);

      expect(result.length).toBe(0);
    });
  });

  describe("Filter and Map Operations", () => {
    it("should filter items based on predicate", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.filter(
        (entity, index) => entity.id() === "2" || index === 2
      );

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("2");
      expect(result.at(1).id()).toBe("3");
    });

    it("should return empty Entities when no items match", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.filter(() => false);

      expect(result.length).toBe(0);
    });

    it("should return all items when all match", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.filter(() => true);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty Entities", () => {
      const entities = new TestCollection();
      const result = entities.filter(() => true);

      expect(result.length).toBe(0);
    });

    it("should provide correct index to predicate", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);
      const indices: number[] = [];

      entities.filter((_, index) => {
        indices.push(index);
        return true;
      });

      expect(indices).toEqual([0, 1, 2]);
    });

    it("should transform items using mapper function", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.map((entity) => entity.id());

      expect(result).toEqual(["1", "2"]);
    });

    it("should provide correct index to mapper", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.map((entity, index) => `${entity.id()}-${index}`);

      expect(result).toEqual(["1-0", "2-1"]);
    });

    it("should work on empty Entities", () => {
      const entities = new TestCollection();
      const result = entities.map((entity) => entity.id());

      expect(result).toEqual([]);
    });

    it("should support complex transformations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.map((entity) => ({
        id: entity.id(),
        hasData: entity.raw() !== undefined,
        name: entity.raw()?.name,
      }));

      expect(result).toEqual([
        { id: "1", hasData: true, name: "Item 1" },
        { id: "2", hasData: true, name: "Item 2" },
      ]);
    });
  });

  describe("Array Conversion", () => {
    it("should return array of entities", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.toArray();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should return empty array for empty Entities", () => {
      const entities = new TestCollection();
      const result = entities.toArray();

      expect(result).toEqual([]);
    });

    it("should return new array instance", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const result1 = entities.toArray();
      const result2 = entities.toArray();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it("should return readonly array of data", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);
      const result = entities.toDataArray();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(items[0]);
      expect(result[1]).toEqual(items[1]);
    });

    it("should return immutable reference to internal data", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);
      const result = entities.toDataArray();

      expect(result).toBe(entities.toDataArray());
    });
  });

  describe("Factory Method", () => {
    it("should create new instance with same type", () => {
      const entities = new TestCollection();
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const result = entities.create(items);

      expect(result).toBeInstanceOf(TestCollection);
      expect(result).not.toBe(Collection);
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should preserve parent reference", () => {
      const parent = { _key: { rootId: "parent", revisionNo: 1 } };
      const entities = new TestCollection([], parent);
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const result = entities.create(items);

      expect(result).toBeInstanceOf(TestCollection);
      expect(result.length).toBe(1);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null/undefined data items gracefully", () => {
      const items: TestData[] = [
        any(null),
        any(undefined),
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
      ];
      const entities = new TestCollection(items.filter(Boolean) as TestData[]);

      expect(entities.length).toBe(1);
      expect(entities.at(0).id()).toBe("1");
    });

    it("should handle Entitiess with mixed valid/invalid data", () => {
      const entities = new TestCollection([
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
      ]);
      const result = entities.push(any({ invalid: "data" }));

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(() => result.at(1).id()).not.toThrow();
      expect(result.at(1).id()).toBeUndefined();
    });

    it("should handle very large Entitiess", () => {
      const items = Array.from({ length: 10000 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );
      const entities = new TestCollection(items);

      expect(entities.length).toBe(10000);
      expect(entities.at(0).id()).toBe("0");
      expect(entities.at(9999).id()).toBe("9999");

      let count = 0;
      for (const _ of entities) {
        count++;
        if (count > 100) break;
      }
      expect(count).toBe(101);
    });

    it("should handle concurrent modifications safely", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);

      const results = Array.from({ length: 100 }, (_, i) =>
        entities.push(
          partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
        )
      );

      expect(entities.length).toBe(1);
      expect(results[0].length).toBe(2);
      expect(results[99].length).toBe(2);
    });

    it("should handle circular reference protection", () => {
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const entities = new TestCollection([item1, item2]);

      const entity1 = entities.at(0);
      const entity2 = entities.at(1);

      expect(entity1.raw()).toBe(item1);
      expect(entity2.raw()).toBe(item2);
      expect(entity1).not.toBe(entity2);
    });

    it("should handle memory efficiency with repeated access", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);

      const newEntitiea = Array.from({ length: 1000 }, () => entities.at(0));

      newEntitiea.forEach((entity) => {
        expect(entity).toBeInstanceOf(TestEntity);
        expect(entity.id()).toBe("1");
      });
    });

    it("should preserve data integrity during transformations", () => {
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Original",
      });
      const entities = new TestCollection([originalData]);

      const filtered = entities.filter(() => true);
      const mapped = entities.map((entity) => entity.raw());
      const arrayForm = entities.toArray();

      expect(originalData.name).toBe("Original");
      expect(filtered.at(0).raw()?.name).toBe("Original");
      expect(mapped[0]?.name).toBe("Original");
      expect(arrayForm[0].raw()?.name).toBe("Original");
    });

    it("should handle floating point indices gracefully", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);

      const result1 = entities.insertAt(
        0.7,
        partial<TestData>({ _key: { id: "0" }, name: "Item 0" })
      );
      const result2 = entities.removeAt(1.9);

      expect(result1.at(0).id()).toBe("0");
      expect(result2.length).toBe(1);
    });

    it("should handle Infinity and NaN indices", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);

      const infinityResult = entities.insertAt(
        Infinity,
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" })
      );
      const nanResult = entities.insertAt(
        NaN,
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" })
      );

      expect(infinityResult.length).toBe(2);
      expect(nanResult.length).toBe(2);
    });
  });

  describe("Performance Characteristics", () => {
    it("should maintain O(n) performance for basic operations", () => {
      const sizes = [100, 1000];
      const results: number[] = [];

      sizes.forEach((size) => {
        const items = Array.from({ length: size }, (_, i) =>
          partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
        );
        const entities = new TestCollection(items);

        const start = performance.now();
        entities.push(
          partial<TestData>({ _key: { id: "new" }, name: "New Item" })
        );
        const end = performance.now();

        results.push(end - start);
      });

      expect(results[0]).toBeLessThan(10);
      expect(results[1]).toBeLessThan(50);
    });

    it("should handle rapid successive operations efficiently", () => {
      const entities = new TestCollection();
      const items = Array.from({ length: 100 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );

      const start = performance.now();
      let result = entities;

      for (const item of items) {
        result = result.push(item);
      }

      const end = performance.now();

      expect(result.length).toBe(100);
      expect(end - start).toBeLessThan(100);
    });

    it("should optimize iteration performance", () => {
      const items = Array.from({ length: 1000 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );
      const entities = new TestCollection(items);

      const start = performance.now();

      let count = 0;
      for (const entity of entities) {
        count++;
        entity.id();
      }

      const end = performance.now();

      expect(count).toBe(1000);
      expect(end - start).toBeLessThan(50);
    });
  });

  describe("Functional Composition", () => {
    it("should support pipe method for chaining operations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => collection.filter((entity) => entity.id() !== "2"),
        (filtered) => filtered.map((entity) => entity.getName()),
        (names) => names.join(", ")
      );

      expect(result).toBe("Item 1, Item 3");
    });

    it("should support single function pipe", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe((collection) => collection.length);

      expect(result).toBe(2);
    });

    it("should support multiple step pipe operations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Apple" }),
        partial<TestData>({ _key: { id: "2" }, name: "Banana" }),
        partial<TestData>({ _key: { id: "3" }, name: "Cherry" }),
        partial<TestData>({ _key: { id: "4" }, name: "Date" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => {
          return collection.filter((entity) => entity.getName().length > 4);
        },
        (filtered) => filtered.map((entity) => entity.getName().toUpperCase()),
        (names) => names.sort(),
        (sorted) => sorted.reverse(),
        (final) => final.join(" | ")
      );

      expect(result).toBe("CHERRY | BANANA | APPLE");
    });
  });

  describe("Advanced Pipe Functionality", () => {
    it("should handle counting and formatting transformations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => collection.length,
        (n) => n * 2,
        (n) => `Count: ${n}`
      );

      expect(result).toBe("Count: 6");
    });

    it("should work with complex data transformations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Alpha" }),
        partial<TestData>({ _key: { id: "2" }, name: "Beta" }),
        partial<TestData>({ _key: { id: "3" }, name: "Gamma" }),
        partial<TestData>({ _key: { id: "4" }, name: "Delta" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => {
          return collection.filter((entity) => entity.getName().length > 4);
        },
        (filtered) => filtered.map((entity) => entity.getName()),
        (names) => names.join(", "),
        (text) => text.toUpperCase()
      );

      expect(result).toBe("ALPHA, GAMMA, DELTA");
    });

    it("should handle greeting transformations", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Test" })];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => collection.at(0).getName(),
        (name) => `Hello, ${name}!`
      );

      expect(result).toBe("Hello, Test!");
    });

    it("should chain multiple string transformations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "One" }),
        partial<TestData>({ _key: { id: "2" }, name: "Two" }),
        partial<TestData>({ _key: { id: "3" }, name: "Three" }),
      ];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) =>
          collection.map((entity) => entity.getName().toUpperCase()),
        (names) => names.join(" - ")
      );

      expect(result).toBe("ONE - TWO - THREE");
    });

    it("should support very long pipe chains with 16 functions", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "data" })];
      const entities = new TestCollection(items);

      const result = entities.pipe(
        (collection) => collection.at(0), // T1: TestEntity
        (entity) => entity.getName(), // T2: string
        (name) => name.toUpperCase(), // T3: string
        (upper) => upper.split(""), // T4: string[]
        (chars) => chars.reverse(), // T5: string[]
        (reversed) => reversed.join(""), // T6: string
        (joined) => `[${joined}]`, // T7: string
        (bracketed) => bracketed.length, // T8: number
        (length) => length * 2, // T9: number
        (doubled) => doubled.toString(), // T10: string
        (str) => str.padStart(4, "0"), // T11: string
        (padded) => padded.split(""), // T12: string[]
        (chars) => chars.map((c) => (c === "0" ? "X" : c)), // T13: string[]
        (mapped) => mapped.join("-"), // T14: string
        (dashed) => dashed.toLowerCase(), // T15: string
        (final) => `Result: ${final}` // T16: string
      );

      expect(result).toBe("Result: x-x-1-2");
    });
  });

  describe("Type Safety and Generics", () => {
    it("should maintain type safety through transformations", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new TestCollection(items);

      const filtered: TestCollection = entities.filter(() => true);
      const mapped = entities.map((entity) => entity.id());
      const newEntities = entities.toArray();
      const data = entities.toDataArray();

      expect(filtered).toBeInstanceOf(TestCollection);
      expect(Array.isArray(mapped)).toBe(true);
      expect(Array.isArray(newEntities)).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should work with inheritance hierarchies", () => {
      class ExtendedTestEntity extends TestEntity {
        getDisplayName(): string {
          return this.raw()?.name || "Unknown";
        }
      }

      class ExtendedTestEntities extends Collection<
        TestData,
        ExtendedTestEntity,
        BusinessEntity
      > {
        protected createEntity(data?: TestData): ExtendedTestEntity {
          return new ExtendedTestEntity(data);
        }
      }

      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new ExtendedTestEntities(items, undefined);

      const entity = entities.at(0);
      const displayName = entity.getDisplayName();

      expect(entity).toBeInstanceOf(ExtendedTestEntity);
      expect(displayName).toBe("Item 1");
    });
  });
});

describe("Entity Pipe and Compose Tests", () => {
  const testData = createEntityTestData();

  describe("Entity Pipe Functionality", () => {
    it("should support pipe operations on individual entities", () => {
      const quote = new Quote(testData.quotes[0]);

      const result = quote.pipe(
        (entity) => entity.getPrimaryParty(),
        (party) => party?.getVehicles(),
        (vehicles) => vehicles?.getTotalValue() ?? 0,
        (value) => `Total: $${value.toLocaleString()}`
      );

      expect(result).toBe("Total: $40,000");
    });

    it("should support single function pipe on entities", () => {
      const driver = new Driver(testData.drivers[0]);

      const result = driver.pipe((entity) => entity.getFullName());

      expect(result).toBe("John Doe");
    });

    it("should chain entity methods with pipe", () => {
      const vehicle = new Vehicle(testData.vehicles[0]);

      const result = vehicle.pipe(
        (entity) => entity.getDisplayName(),
        (name) => name.toUpperCase(),
        (upperName) => `[${upperName}]`,
        (formatted) => `Vehicle: ${formatted}`
      );

      expect(result).toBe("Vehicle: [2021 BLUE HONDA CIVIC]");
    });

    it("should work with complex entity transformations", () => {
      const party = new Party(testData.parties[0]);

      const result = party.pipe(
        (entity) => entity.getDrivers(),
        (drivers) => drivers.getHighRiskDrivers(),
        (highRisk) => highRisk.length,
        (count) => {
          return count > 0 ? "Has high risk drivers" : "No high risk drivers";
        }
      );

      expect(result).toBe("Has high risk drivers");
    });
  });

  describe("Advanced Entity Pipe Functionality", () => {
    it("should support complex entity transformations", () => {
      const quote = new Quote(testData.quotes[0]);

      const result = quote.pipe(
        (entity) => entity.getPremium(),
        (value) => `Premium: $${value}`
      );

      expect(result).toBe("Premium: $1200");
    });

    it("should work with complex entity pipe chains", () => {
      const coverage = new Coverage(testData.coverages[0]);

      const result = coverage.pipe(
        (entity) => entity.getType(),
        (type) => type.charAt(0).toUpperCase() + type.slice(1),
        (description) => `Coverage: ${description}`
      );

      expect(result).toBe("Coverage: Liability");
    });

    it("should handle entity calculations and formatting", () => {
      const violation = new ViolationEntity(testData.violations[0]);

      const result = violation.pipe(
        (entity) => entity.getPoints(),
        (points) => points * 10,
        (multiplied) => `Points: ${multiplied}`
      );

      expect(result).toBe("Points: 30");
    });

    it("should work with entity relationships", () => {
      const quote = new Quote(testData.quotes[0]);

      const result = quote.pipe(
        (entity) => entity.getPrimaryParty(),
        (party) => party?.getVehicles(),
        (vehicles) => vehicles?.getClassicVehicles().length ?? 0,
        (count) => `Found ${count} classic vehicle(s)`
      );

      expect(result).toBe("Found 1 classic vehicle(s)");
    });
  });

  describe("Entity and Collection Pipe Integration", () => {
    it("should seamlessly transition between entities and collections", () => {
      const quotes = new Quotes(testData.quotes);

      // Start with collection, pipe to entity, then back to collection operations
      const result = quotes.pipe(
        (collection) => collection.getActiveQuotes(),
        (activeQuotes) => activeQuotes.at(0),
        (quote) =>
          quote.pipe(
            (entity) => entity.getPrimaryParty(),
            (party) => party?.getDrivers(),
            (drivers) => drivers?.map((driver) => driver.getFullName()),
            (names) => names?.join(" & ") ?? "No drivers"
          )
      );

      expect(result).toBe("John Doe & Jane Smith");
    });

    it("should combine entity and collection pipe operations", () => {
      const drivers = new Drivers(testData.drivers);

      const result = drivers.pipe(
        (collection) => collection.getAverageAge(),
        (avgAge) => avgAge.toFixed(1),
        (riskInfo) => `Age ${riskInfo}`,
        (summary) => `Driver Summary: ${summary}`
      );

      expect(result.startsWith("Driver Summary: Age")).toBe(true);
    });
  });
});

describe("Direct Entity and Collection Tests", () => {
  const testData = createEntityTestData();

  describe("ViolationEntity Functionality", () => {
    it("should work with individual violation entities", () => {
      const violation = new ViolationEntity(testData.violations[0]);

      expect(violation.getPoints()).toBe(3);
      expect(violation.isRecent()).toBe(true);
      expect(violation.isMajor()).toBe(false);
      expect(violation.getFine()).toBe(150);
      expect(violation.getDescription()).toBe("Going 20mph over speed limit");

      const majorViolation = new ViolationEntity(testData.violations[1]);
      expect(majorViolation.isMajor()).toBe(true);
      expect(majorViolation.getPoints()).toBe(6);
    });
  });

  describe("Violations Collection Functionality", () => {
    it("should work with violations collections", () => {
      const violations = new Violations(testData.violations);

      expect(violations.length).toBe(2);
      expect(violations.getTotalPoints()).toBe(9);
      expect(violations.getTotalFines()).toBe(650);

      const recentViolations = violations.getRecent();
      expect(recentViolations.length).toBe(1);
      expect(recentViolations.at(0).getDescription()).toBe(
        "Going 20mph over speed limit"
      );

      const majorViolations = violations.getMajorViolations();
      expect(majorViolations.length).toBe(1);
      expect(majorViolations.at(0).getPoints()).toBe(6);
    });
  });

  describe("Party Entity Functionality", () => {
    it("should work with individual party entities", () => {
      const party = new Party(testData.parties[0]);

      expect(party.getName()).toBe("John Doe");
      expect(party.isPrimary()).toBe(true);
      expect(party.getTotalVehicleValue()).toBe(40000);
      expect(party.hasHighRiskDrivers()).toBe(true);
      expect(party.getAddress()).toBe("123 Main St, San Francisco, CA 94102");

      const contactInfo = party.getContactInfo();
      expect(contactInfo.phone).toBe("(555) 123-4567");
      expect(contactInfo.email).toBe("john.doe@email.com");

      const vehicles = party.getVehicles();
      expect(vehicles.length).toBe(2);

      const drivers = party.getDrivers();
      expect(drivers.length).toBe(2);
    });
  });

  describe("Parties Collection Functionality", () => {
    it("should work with parties collections", () => {
      const parties = new Parties(testData.parties);

      expect(parties.length).toBe(2);
      expect(parties.getTotalVehicleValue()).toBe(40000);

      const primaryParties = parties.getPrimaryParties();
      expect(primaryParties.length).toBe(1);
      expect(primaryParties.at(0).getName()).toBe("John Doe");

      const partiesWithHighRisk = parties.getPartiesWithHighRisk();
      expect(partiesWithHighRisk.length).toBe(1);
      expect(partiesWithHighRisk.at(0).getName()).toBe("John Doe");
    });
  });

  describe("Coverage Entity Functionality", () => {
    it("should work with individual coverage entities", () => {
      const coverage = new Coverage(testData.coverages[0]);

      expect(coverage.getType()).toBe("liability");
      expect(coverage.getPremium()).toBe(600);
      expect(coverage.getLimit()).toBe(100000);
      expect(coverage.getDeductible()).toBe(500);
      expect(coverage.isRequired()).toBe(true);
      expect(coverage.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );

      const optionalCoverage = new Coverage(testData.coverages[1]);
      expect(optionalCoverage.isRequired()).toBe(false);
      expect(optionalCoverage.getType()).toBe("comprehensive");
    });
  });

  describe("Coverages Collection Functionality", () => {
    it("should work with coverages collections", () => {
      const coverages = new Coverages(testData.coverages);

      expect(coverages.length).toBe(2);
      expect(coverages.getTotalPremium()).toBe(1000);

      const requiredCoverages = coverages.getRequiredCoverages();
      expect(requiredCoverages.length).toBe(1);
      expect(requiredCoverages.at(0).getType()).toBe("liability");

      const liabilityCoverage = coverages.getCoverageByType("liability");
      expect(liabilityCoverage?.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );

      const nonExistentCoverage = coverages.getCoverageByType("nonexistent");
      expect(nonExistentCoverage).toBeUndefined();
    });
  });
});

describe("Entity and Entities Tests", () => {
  const testData = createEntityTestData();

  describe("Pipe and Compose with Domain Entities", () => {
    it("should work with domain-specific entities using pipe", () => {
      const quotes = new Quotes(testData.quotes);

      const result = quotes.pipe(
        (collection) => collection.getActiveQuotes(),
        (active) => active.at(0),
        (quote) => quote.getPrimaryParty(),
        (party) => party?.getVehicles(),
        (vehicles) => vehicles?.getTotalValue() ?? 0,
        (value) => `Total Vehicle Value: $${value.toLocaleString()}`
      );

      expect(result).toBe("Total Vehicle Value: $40,000");
    });

    it("should work with domain-specific entities using pipe", () => {
      const quotes = new Quotes(testData.quotes);

      const result = quotes.pipe(
        (quotes) => quotes.getActiveQuotes(),
        (quotes) => quotes.at(0),
        (quote) => quote.getPrimaryParty(),
        (party) => party?.getDrivers(),
        (drivers) => drivers?.getHighRiskDrivers().length ?? 0,
        (count) => `High Risk Drivers: ${count}`
      );

      expect(result).toBe("High Risk Drivers: 1");
    });

    it("should chain multiple collection operations with pipe", () => {
      const quotes = new Quotes(testData.quotes);

      const result = quotes.pipe(
        (collection) => collection.at(0),
        (quote) => quote.getParties().at(0).getDrivers(),
        (drivers) => drivers.getHighRiskDrivers(),
        (highRisk) => highRisk.map((driver) => driver.getFullName()),
        (names) => names.join(", ")
      );

      expect(result).toBe("Jane Smith");
    });
  });

  describe("Entity Functionality", () => {
    it("should work with individual entities", () => {
      const quote = new Quote(testData.quotes[0]);

      expect(quote.getQuoteNumber()).toBe("QT-2024-001");
      expect(quote.isActive()).toBe(true);
      expect(quote.getPremium()).toBe(1200);
      expect(quote.hasHighRiskElements()).toBe(true);

      const primaryParty = quote.getPrimaryParty();
      expect(primaryParty?.getName()).toBe("John Doe");
      expect(primaryParty?.getTotalVehicleValue()).toBe(40000);
    });

    it("should handle driver risk assessment", () => {
      const driver = new Driver(testData.drivers[0]);

      expect(driver.getFullName()).toBe("John Doe");
      expect(driver.getAge()).toBeGreaterThan(30);
      expect(driver.getTotalPoints()).toBe(3);
      expect(driver.isHighRisk()).toBe(false);

      const youngDriver = new Driver(testData.drivers[1]);
      expect(youngDriver.isHighRisk()).toBe(true);
    });

    it("should identify classic vehicles", () => {
      const modernVehicle = new Vehicle(testData.vehicles[0]);
      const classicVehicle = new Vehicle(testData.vehicles[1]);

      expect(modernVehicle.isClassic()).toBe(false);
      expect(classicVehicle.isClassic()).toBe(true);
      expect(classicVehicle.getDisplayName()).toBe("1995 Black BMW 3 Series");
    });

    it("should handle null/undefined data in entities", () => {
      const quote = new Quote(
        any({
          _key: { id: "Q4" },
          quoteNumber: null,
          premium: NaN,
          parties: null,
        })
      );

      expect(quote.getQuoteNumber()).toBe("Unknown");
      expect(quote.getStatus()).toBe("draft");
      expect(quote.getPremium()).toBe(0);
      expect(quote.getParties().length).toBe(0);
      expect(quote.getCoverages().length).toBe(0);
    });
  });

  describe("IterableEntities Functionality", () => {
    it("should work with quote Entitiess", () => {
      const quotes = new Quotes(testData.quotes);

      expect(quotes.length).toBe(2);
      expect(quotes.getTotalPremium()).toBe(2000);

      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);
      expect(activeQuotes.at(0).getQuoteNumber()).toBe("QT-2024-001");

      const highRiskQuotes = quotes.getHighRiskQuotes();
      expect(highRiskQuotes.length).toBe(1);
    });

    it("should work with vehicle Entitiess", () => {
      const vehicles = new Vehicles(testData.vehicles);

      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).getDisplayName()).toBe(
        "1995 Black BMW 3 Series"
      );
    });

    it("should work with driver Entitiess", () => {
      const drivers = new Drivers(testData.drivers);

      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1);
      expect(highRiskDrivers.at(0).getFullName()).toBe("Jane Smith");
    });

    it("should preserve immutability", () => {
      const quotes = new Quotes(testData.quotes);
      const originalLength = quotes.length;

      const newQuotes = quotes.push(partial({ _key: { id: "Q3" } }));

      expect(quotes.length).toBe(originalLength);
      expect(newQuotes.length).toBe(originalLength + 1);
      expect(quotes).not.toBe(newQuotes);
    });

    it("should handle index bounds safely", () => {
      const quotes = new Quotes(testData.quotes);

      const outOfBounds = quotes.at(999);
      expect(outOfBounds).toBeDefined();
      expect(outOfBounds.raw()).toBeUndefined();

      const negative = quotes.at(-1);
      expect(negative).toBeDefined();
      expect(negative.raw()).toBeUndefined();
    });
  });

  describe("Immer Integration with Entities and Entitiess", () => {
    it("should demonstrate complex state updates with Immer", () => {
      const quotes = new Quotes(testData.quotes);
      const originalQuote = quotes.at(0);

      const updatedQuoteData = produce(originalQuote.raw()!, (draft) => {
        draft.premium = 1500;

        if (draft.coverages) {
          draft.coverages.push({
            _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
            type: "collision",
            limit: 75000,
            deductible: 500,
            premium: 300,
          });
        }

        const primaryParty = draft.parties?.find((p) => p.type === "primary");
        if (primaryParty?.vehicles && primaryParty?.vehicles?.length > 0) {
          primaryParty.vehicles[0].value = 30000;
        }

        const firstDriver = primaryParty?.drivers?.[0];

        if (firstDriver?.violations) {
          firstDriver.violations.push({
            _key: { rootId: "violations", revisionNo: 1, id: "V3" },
            type: "parking",
            date: "2024-01-15",
            points: 1,
          });
        }
      });

      const updatedQuote = new Quotes([updatedQuoteData]).at(0);

      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4);
    });

    it("should handle Entities mutations with Immer", () => {
      const quotes = new Quotes(testData.quotes);

      const newQuoteData = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
      });

      const expandedQuotes = quotes.push(newQuoteData).insertAt(
        1,
        partial({
          _key: { id: "Q4" },
          quoteNumber: "QT-2024-004",
          status: "draft",
          premium: 750,
        })
      );

      expect(quotes.length).toBe(2);
      expect(expandedQuotes.length).toBe(4);
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });
  });

  describe("Performance and Optimization", () => {
    it("should demonstrate entity caching performance", () => {
      const quotes = new Quotes(testData.quotes);

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        quotes.at(0);
        quotes.at(1);
      }

      const cached = performance.now() - start;

      const start2 = performance.now();
      for (let i = 0; i < 100; i++) {
        new Quote(testData.quotes[0]);
        new Quote(testData.quotes[1]);
      }
      const uncached = performance.now() - start2;

      expect(cached).toBeLessThan(uncached * 5);
    });
  });

  describe("Advanced Entities Patterns", () => {
    it("should support Entities chaining and filtering", () => {
      const quotes = new Quotes(testData.quotes);

      const result = quotes
        .filter((quote) => quote.getPremium() > 1000)
        .map((quote) => ({
          number: quote.getQuoteNumber(),
          premium: quote.getPremium(),
          isHighRisk: quote.hasHighRiskElements(),
        }));

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        number: "QT-2024-001",
        premium: 1200,
        isHighRisk: true,
      });
    });

    it("should handle nested entity relationships", () => {
      const quotes = new Quotes(testData.quotes);
      const firstQuote = quotes.at(0);

      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      const vehicles = primaryParty?.getVehicles();
      expect(vehicles?.length).toBe(2);

      const drivers = primaryParty?.getDrivers();
      expect(drivers?.length).toBe(2);

      const classicVehicle = vehicles?.toArray().find((v) => v.isClassic());
      expect(classicVehicle).toBeDefined();
      expect(classicVehicle!.getDisplayName()).toBe("1995 Black BMW 3 Series");

      const highRiskDriver = drivers?.toArray().find((d) => d.isHighRisk());
      expect(highRiskDriver).toBeDefined();
      expect(highRiskDriver!.getFullName()).toBe("Jane Smith");
    });
  });
});

describe("Core Integration: Entity + Entities + Immer", () => {
  const testData = createEntityTestData();

  describe("All Entitiess Integration", () => {
    it("should demonstrate usage of all Entities types", () => {
      const quotes = new Quotes(testData.quotes);
      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      const quote = activeQuotes.at(0);

      const parties = quote.getParties();
      const primaryParties = parties.getPrimaryParties();
      expect(primaryParties.length).toBe(1);

      const partiesWithHighRisk = parties.getPartiesWithHighRisk();
      expect(partiesWithHighRisk.length).toBe(1);
      expect(partiesWithHighRisk.at(0).getName()).toBe("John Doe");

      const primaryParty = primaryParties.at(0);

      const vehicles = primaryParty.getVehicles();
      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const ecoVehicles = vehicles.getEcoFriendlyVehicles();
      expect(ecoVehicles.length).toBe(1);
      expect(ecoVehicles.at(0).getDisplayName()).toBe("2021 Blue Honda Civic");

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).isHighMileage()).toBe(true);

      const highMileageVehicles = vehicles.getHighMileageVehicles();
      expect(highMileageVehicles.length).toBe(1);
      expect(highMileageVehicles.at(0).getDisplayName()).toBe(
        "1995 Black BMW 3 Series"
      );

      const drivers = primaryParty.getDrivers();
      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1);

      const experiencedDrivers = drivers.getExperiencedDrivers();
      expect(experiencedDrivers.length).toBe(1);

      const educatedDrivers = drivers.getEducatedDrivers();
      expect(educatedDrivers.length).toBe(2);

      const johnDriver = drivers.at(0);
      const violations = johnDriver.getViolations();
      expect(violations.length).toBe(2);
      expect(violations.getTotalPoints()).toBe(9);
      expect(violations.getTotalFines()).toBe(650);

      const recentViolations = violations.getRecent();
      expect(recentViolations.length).toBe(1);

      const majorViolations = violations.getMajorViolations();
      expect(majorViolations.length).toBe(1);

      const coverages = quote.getCoverages();
      expect(coverages.length).toBe(2);
      expect(coverages.getTotalPremium()).toBe(1000);

      const requiredCoverages = coverages.getRequiredCoverages();
      expect(requiredCoverages.length).toBe(1);

      const liabilityCoverage = coverages.getCoverageByType("liability");
      expect(liabilityCoverage?.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should demonstrate optional attributes usage", () => {
      const quotes = new Quotes(testData.quotes);
      const quote = quotes.at(0);

      expect(quote.getAgent()).toBe("Alice Johnson");
      expect(quote.getDiscounts()).toBe(100);
      expect(quote.getEffectiveDate()).toBe("2024-01-01");

      const primaryParty = quote.getPrimaryParty()!;
      expect(primaryParty.getAddress()).toBe(
        "123 Main St, San Francisco, CA 94102"
      );

      const contact = primaryParty.getContactInfo();
      expect(contact.phone).toBe("(555) 123-4567");
      expect(contact.email).toBe("john.doe@email.com");

      const vehicle = primaryParty.getVehicles().at(0);
      expect(vehicle.getVin()).toBe("1HGBH41JXMN109186");
      expect(vehicle.isEcoFriendly()).toBe(true);
      expect(vehicle.getDisplayName()).toBe("2021 Blue Honda Civic");

      const driver = primaryParty.getDrivers().at(0);
      expect(driver.getLicenseNumber()).toBe("DL123456789");
      expect(driver.isExperienced()).toBe(true);
      expect(driver.hasEducation()).toBe(true);

      const violation = driver.getViolations().at(0);
      expect(violation.getFine()).toBe(150);
      expect(violation.getDescription()).toBe("Going 20mph over speed limit");

      const coverage = quote.getCoverages().at(0);
      expect(coverage.isRequired()).toBe(true);
      expect(coverage.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should show minimal data creation with only necessary attributes", () => {
      const minimalQuote = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-MINIMAL",
        status: "draft",
        premium: 500,
      });

      const quote = new Quote(minimalQuote);

      expect(quote.getQuoteNumber()).toBe("QT-MINIMAL");
      expect(quote.getPremium()).toBe(500);
      expect(quote.getAgent()).toBeUndefined();
      expect(quote.getParties().length).toBe(0);
      expect(quote.getCoverages().length).toBe(0);

      const minimalVehicle = partial<VehicleData>({
        _key: { id: "V3" },
        make: "Toyota",
        model: "Prius",
        year: 2023,
        value: 30000,
      });

      const vehicle = new Vehicle(minimalVehicle);
      expect(vehicle.getDisplayName()).toBe("2023 Toyota Prius");
      expect(vehicle.getVin()).toBeUndefined();
      expect(vehicle.isEcoFriendly()).toBe(false);
      expect(vehicle.isHighMileage()).toBe(false);
    });
  });

  describe("Core Integration Patterns", () => {
    it("should integrate entities and Entitiess", () => {
      const quotes = new Quotes(testData.quotes);

      const activeQuotes = quotes.getActiveQuotes();
      const firstQuote = activeQuotes.at(0);

      expect(firstQuote.getQuoteNumber()).toBe("QT-2024-001");
      expect(firstQuote.isActive()).toBe(true);

      const primaryPartyName = firstQuote.getPrimaryParty()?.getName();

      expect(primaryPartyName).toBe("John Doe");

      const riskAnalysis = activeQuotes.toArray().map((quote) => {
        const primaryParty = quote.getPrimaryParty();
        const vehicles = primaryParty?.getVehicles();

        const hasHighRisk = quote.hasHighRiskElements();
        const totalValue = quote.getTotalVehicleValue();

        return {
          quoteNumber: quote.getQuoteNumber(),
          vehicleCount: vehicles?.length,
          totalValue,
          hasHighRisk,
        };
      });

      expect(riskAnalysis[0]).toEqual({
        quoteNumber: "QT-2024-001",
        vehicleCount: 2,
        totalValue: 40000,
        hasHighRisk: true,
      });
    });

    it("should handle complex data transformations using entity methods", () => {
      const quotes = new Quotes(testData.quotes);

      const quoteSummaries = quotes
        .toArray()
        .map((quote) => {
          const raw = quote.raw();
          if (!raw) return null;

          const parties = quote.getParties();
          const vehicleCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getVehicles().length, 0);
          const driverCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getDrivers().length, 0);

          const totalValue = quote.getTotalVehicleValue();
          const isHighRisk = quote.hasHighRiskElements();

          return {
            quoteNumber: quote.getQuoteNumber(),
            status: quote.getStatus(),
            premium: quote.getPremium(),
            vehicleCount,
            driverCount,
            totalValue,
            isHighRisk,
          };
        })
        .filter((summary) => summary !== null);

      expect(quoteSummaries).toHaveLength(2);
      expect(quoteSummaries[0]).toEqual({
        quoteNumber: "QT-2024-001",
        status: "active",
        premium: 1200,
        vehicleCount: 2,
        driverCount: 2,
        totalValue: 40000,
        isHighRisk: true,
      });
    });
  });

  describe("Immer Integration", () => {
    it("should demonstrate complex state updates with Immer", () => {
      const quotes = new Quotes(testData.quotes);
      const originalQuote = quotes.at(0);

      const updatedQuoteData = produce(originalQuote.raw()!, (draft) => {
        draft.premium = 1500;

        if (draft.coverages) {
          draft.coverages.push({
            _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
            type: "collision",
            limit: 75000,
            deductible: 500,
            premium: 300,
          });
        }

        const primaryParty = draft.parties?.find((p) => p.type === "primary");
        if (
          primaryParty &&
          primaryParty.vehicles &&
          primaryParty.vehicles.length > 0
        ) {
          primaryParty.vehicles[0].value = 30000;
        }

        const firstDriver = primaryParty?.drivers?.[0];
        if (firstDriver && firstDriver.violations) {
          firstDriver.violations.push({
            _key: { rootId: "violations", revisionNo: 1, id: "V3" },
            type: "parking",
            date: "2024-01-15",
            points: 1,
          });
        }
      });

      const updatedQuotes = new Quotes([updatedQuoteData]);
      const updatedQuote = updatedQuotes.at(0);

      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4);
    });

    it("should handle Entities mutations with Immer", () => {
      const quotes = new Quotes(testData.quotes);

      const newQuoteData = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
      });

      const expandedQuotes = quotes.push(newQuoteData).insertAt(
        1,
        partial<QuoteData>({
          _key: { id: "Q4" },
          quoteNumber: "QT-2024-004",
          status: "draft",
          premium: 750,
        })
      );

      expect(quotes.length).toBe(2);
      expect(expandedQuotes.length).toBe(4);
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });

    it("should combine Immer with entity methods for complex updates", () => {
      const portfolioData = {
        quotes: testData.quotes,
        metadata: { version: 1, lastUpdated: "2024-01-01" },
      };

      const updatedPortfolio = produce(portfolioData, (draft) => {
        draft.metadata.version = 2;
        draft.metadata.lastUpdated = "2024-01-15";

        const activeQuote = draft.quotes.find((q) => q.status === "active");
        if (activeQuote) {
          activeQuote.premium = 1350;

          if (activeQuote.parties) {
            activeQuote.parties.push({
              _key: { rootId: "parties", revisionNo: 1, id: "P3" },
              name: "Secondary Driver",
              type: "additional",
              vehicles: [],
              drivers: [
                {
                  _key: { rootId: "drivers", revisionNo: 1, id: "D3" },
                  licenseNumber: "DL345678",
                  firstName: "Bob",
                  lastName: "Wilson",
                  dateOfBirth: "1980-05-10",
                  violations: [],
                },
              ],
            });
          }
        }
      });

      expect(portfolioData.metadata.version).toBe(1);
      expect(portfolioData.quotes[0].premium).toBe(1200);
      expect(portfolioData.quotes[0].parties?.length).toBe(2);

      expect(updatedPortfolio.metadata.version).toBe(2);
      expect(updatedPortfolio.quotes[0].premium).toBe(1350);
      expect(updatedPortfolio.quotes[0].parties?.length).toBe(3);

      const updatedQuotes = new Quotes(updatedPortfolio.quotes);
      const updatedQuote = updatedQuotes.at(0);
      const newPartyName = updatedQuote.getParties().at(2).getName();

      expect(newPartyName).toBe("Secondary Driver");
    });
  });

  describe("Combined Usage Patterns", () => {
    it("should demonstrate end-to-end workflow with entities and Entitiess", () => {
      const quotes = new Quotes(testData.quotes);

      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      const firstQuote = activeQuotes.at(0);
      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      const vehicles = primaryParty?.getVehicles();
      const drivers = primaryParty?.getDrivers();

      const firstDriverViolations = drivers?.at(0)?.getRecentViolations();

      expect(vehicles?.length).toBe(2);
      expect(drivers?.length).toBe(2);
      expect(firstDriverViolations?.length).toBe(1);

      const riskAssessment = {
        hasClassicVehicles: vehicles?.toArray().some((v) => v.isClassic()),
        hasHighRiskDrivers: drivers?.toArray().some((d) => d.isHighRisk()),
        totalVehicleValue: vehicles?.pipe((v) =>
          v.toArray().reduce((sum, v) => sum + v.getValue(), 0)
        ),
        totalPoints: drivers?.pipe((d) =>
          d.toArray().reduce((sum, d) => sum + d.getTotalPoints(), 0)
        ),
      };

      expect(riskAssessment.hasClassicVehicles).toBe(true);
      expect(riskAssessment.hasHighRiskDrivers).toBe(true);
      expect(riskAssessment.totalVehicleValue).toBe(40000);
      expect(riskAssessment.totalPoints).toBe(3);
    });
  });
});
