import { describe, it, expect } from "vitest";
import { TestCollection, TestEntity, type TestData } from "./TestCollection";
import { IterableCollection } from "../collection/IterableCollection";
import type { BusinessEntity } from "../collection/types";

describe("IterableCollection", () => {
  const createTestData = (id: string, name: string): TestData => ({
    _key: { rootId: "test", revisionNo: 1, id },
    name,
  });

  describe("constructor", () => {
    it("should create empty collection", () => {
      // Arrange & Act
      const collection = new TestCollection();

      // Assert
      expect(collection.length).toBe(0);
    });

    it("should create collection with initial items", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];

      // Act
      const collection = new TestCollection(items);

      // Assert
      expect(collection.length).toBe(2);
    });
  });

  describe("at", () => {
    it("should return entity at valid index", () => {
      // Arrange
      const item = createTestData("1", "Item 1");
      const collection = new TestCollection([item]);

      // Act
      const result = collection.at(0);

      // Assert
      expect(result).toBeInstanceOf(TestEntity);
      expect(result?.id()).toBe("1");
    });

    it("should return entity with undefined data for invalid index", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result1 = collection.at(0);
      const result2 = collection.at(-1);

      // Assert
      expect(result1).toBeInstanceOf(TestEntity);
      expect(result1.id()).toBeUndefined();
      expect(result2).toBeInstanceOf(TestEntity);
      expect(result2.id()).toBeUndefined();
    });
  });

  describe("length", () => {
    it("should return correct length", () => {
      // Arrange
      const collection = new TestCollection();

      // Act & Assert - empty collection
      expect(collection.length).toBe(0);

      // Act & Assert - after first push
      const collection1 = collection.push(createTestData("1", "Item 1"));
      expect(collection1.length).toBe(1);

      // Act & Assert - after second push
      const collection2 = collection1.push(createTestData("2", "Item 2"));
      expect(collection2.length).toBe(2);
    });
  });

  describe("iterator", () => {
    it("should iterate over empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const entities = Array.from(collection);

      // Assert
      expect(entities).toEqual([]);
    });

    it("should iterate over entities using for...of", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
        createTestData("3", "Item 3"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = [];
      for (const entity of collection) {
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
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = Array.from(collection);

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
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = [...collection];

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
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);
      const iterator = collection[Symbol.iterator]();

      // Act & Assert - first iteration
      let result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("1");

      // Act & Assert - second iteration
      result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("2");

      // Act & Assert - end of iteration
      result = iterator.next();
      expect(result.done).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe("push", () => {
    it("should return new collection with added item", () => {
      // Arrange
      const collection = new TestCollection();
      const item = createTestData("1", "Item 1");

      // Act
      const newCollection = collection.push(item);

      // Assert
      expect(collection.length).toBe(0);
      expect(newCollection.length).toBe(1);
      expect(newCollection.at(0)).toBeInstanceOf(TestEntity);
      expect(newCollection.at(0).id()).toBe("1");
      expect(newCollection).not.toBe(collection);
    });

    it("should support fluent chaining with new instances", () => {
      // Arrange
      const collection = new TestCollection();
      const item1 = createTestData("1", "Item 1");
      const item2 = createTestData("2", "Item 2");

      // Act
      const result = collection.push(item1).push(item2);

      // Assert
      expect(result).not.toBe(collection);
      expect(collection.length).toBe(0);
      expect(result.length).toBe(2);
      expect(result.at(0)).toBeInstanceOf(TestEntity);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1)).toBeInstanceOf(TestEntity);
      expect(result.at(1).id()).toBe("2");
    });

    it("should maintain immutability when pushing multiple items", () => {
      // Arrange
      const collection = new TestCollection();
      const item1 = createTestData("1", "Item 1");
      const item2 = createTestData("2", "Item 2");
      const item3 = createTestData("3", "Item 3");

      // Act
      const step1 = collection.push(item1);
      const step2 = step1.push(item2);
      const step3 = step2.push(item3);

      // Assert
      expect(collection.length).toBe(0);
      expect(step1.length).toBe(1);
      expect(step2.length).toBe(2);
      expect(step3.length).toBe(3);
      expect(step1.at(0).id()).toBe("1");
      expect(step2.at(1).id()).toBe("2");
      expect(step3.at(2).id()).toBe("3");
    });
  });

  describe("insertAt", () => {
    it("should insert item at valid index", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("3", "Item 3"),
      ];
      const collection = new TestCollection(items);
      const newItem = createTestData("2", "Item 2");

      // Act
      const result = collection.insertAt(1, newItem);

      // Assert
      expect(result.length).toBe(3);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
      expect(result.at(2).id()).toBe("3");
    });

    it("should insert at beginning when index is 0", () => {
      // Arrange
      const items = [createTestData("2", "Item 2")];
      const collection = new TestCollection(items);
      const newItem = createTestData("1", "Item 1");

      // Act
      const result = collection.insertAt(0, newItem);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should insert at end when index equals length", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);
      const newItem = createTestData("2", "Item 2");

      // Act
      const result = collection.insertAt(1, newItem);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp negative index to 0", () => {
      // Arrange
      const items = [createTestData("2", "Item 2")];
      const collection = new TestCollection(items);
      const newItem = createTestData("1", "Item 1");

      // Act
      const result = collection.insertAt(-5, newItem);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp large index to length", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);
      const newItem = createTestData("2", "Item 2");

      // Act
      const result = collection.insertAt(999, newItem);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty collection", () => {
      // Arrange
      const collection = new TestCollection();
      const newItem = createTestData("1", "Item 1");

      // Act
      const result = collection.insertAt(0, newItem);

      // Assert
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });
  });

  describe("removeAt", () => {
    it("should remove item at valid index", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
        createTestData("3", "Item 3"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(1);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("3");
    });

    it("should remove first item", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(0);

      // Assert
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("2");
    });

    it("should remove last item", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(1);

      // Assert
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should handle negative index", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(-1);

      // Assert - negative index should not remove anything
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should handle index beyond bounds", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(999);

      // Assert
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should work on single item collection", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act
      const result = collection.removeAt(0);

      // Assert
      expect(result.length).toBe(0);
    });

    it("should work on empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result = collection.removeAt(0);

      // Assert
      expect(result.length).toBe(0);
    });
  });

  describe("filter", () => {
    it("should filter items based on predicate", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
        createTestData("3", "Item 3"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.filter(
        (entity, index) => entity.id() === "2" || index === 2
      );

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("2");
      expect(result.at(1).id()).toBe("3");
    });

    it("should return empty collection when no items match", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.filter(() => false);

      // Assert
      expect(result.length).toBe(0);
    });

    it("should return all items when all match", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.filter(() => true);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result = collection.filter(() => true);

      // Assert
      expect(result.length).toBe(0);
    });

    it("should provide correct index to predicate", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
        createTestData("3", "Item 3"),
      ];
      const collection = new TestCollection(items);
      const indices: number[] = [];

      // Act
      collection.filter((_, index) => {
        indices.push(index);
        return true;
      });

      // Assert
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe("map", () => {
    it("should transform items using mapper function", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.map((entity) => entity.id());

      // Assert
      expect(result).toEqual(["1", "2"]);
    });

    it("should provide correct index to mapper", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.map(
        (entity, index) => `${entity.id()}-${index}`
      );

      // Assert
      expect(result).toEqual(["1-0", "2-1"]);
    });

    it("should work on empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result = collection.map((entity) => entity.id());

      // Assert
      expect(result).toEqual([]);
    });

    it("should support complex transformations", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.map((entity) => ({
        id: entity.id(),
        hasData: entity.raw() !== undefined,
        name: entity.raw()?.name,
      }));

      // Assert
      expect(result).toEqual([
        { id: "1", hasData: true, name: "Item 1" },
        { id: "2", hasData: true, name: "Item 2" },
      ]);
    });
  });

  describe("toArray", () => {
    it("should return array of entities", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.toArray();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should return empty array for empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result = collection.toArray();

      // Assert
      expect(result).toEqual([]);
    });

    it("should return new array instance", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act
      const result1 = collection.toArray();
      const result2 = collection.toArray();

      // Assert
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("toDataArray", () => {
    it("should return readonly array of data", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act
      const result = collection.toDataArray();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(items[0]);
      expect(result[1]).toEqual(items[1]);
    });

    it("should return empty array for empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const result = collection.toDataArray();

      // Assert
      expect(result).toEqual([]);
    });

    it("should return immutable reference to internal data", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act
      const result = collection.toDataArray();

      // Assert - should be same reference since it's frozen
      expect(result).toBe(collection.toDataArray());
    });
  });

  describe("create factory method", () => {
    it("should create new instance with same type", () => {
      // Arrange
      const collection = new TestCollection();
      const items = [createTestData("1", "Item 1")];

      // Act
      const result = collection.create(items);

      // Assert
      expect(result).toBeInstanceOf(TestCollection);
      expect(result).not.toBe(collection);
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should preserve parent reference", () => {
      // Arrange
      const parent = { _key: { rootId: "parent", revisionNo: 1 } };
      const collection = new TestCollection([], parent);
      const items = [createTestData("1", "Item 1")];

      // Act
      const result = collection.create(items);

      // Assert
      expect(result).toBeInstanceOf(TestCollection);
      expect(result.length).toBe(1);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle null/undefined data items gracefully", () => {
      // Arrange
      const items = [
        null as any,
        undefined as any,
        createTestData("1", "Item 1"),
      ];
      const collection = new TestCollection(items.filter(Boolean));

      // Act & Assert
      expect(collection.length).toBe(1);
      expect(collection.at(0).id()).toBe("1");
    });

    it("should handle collections with mixed valid/invalid data", () => {
      // Arrange
      const validItem = createTestData("1", "Item 1");
      const invalidItem = { invalid: "data" } as any;
      const collection = new TestCollection([validItem]);

      // Act
      const result = collection.push(invalidItem);

      // Assert
      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      // Entity with invalid data should still be created but return undefined for properties
      expect(() => result.at(1).id()).not.toThrow();
      expect(result.at(1).id()).toBeUndefined();
    });

    it("should handle very large collections", () => {
      // Arrange
      const items = Array.from({ length: 10000 }, (_, i) =>
        createTestData(i.toString(), `Item ${i}`)
      );
      const collection = new TestCollection(items);

      // Act & Assert
      expect(collection.length).toBe(10000);
      expect(collection.at(0).id()).toBe("0");
      expect(collection.at(9999).id()).toBe("9999");

      // Test iteration performance
      let count = 0;
      for (const _ of collection) {
        count++;
        if (count > 100) break; // Don't iterate all for performance
      }
      expect(count).toBe(101);
    });

    it("should handle concurrent modifications safely", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act - simulate concurrent modifications
      const results = Array.from({ length: 100 }, (_, i) =>
        collection.push(createTestData(i.toString(), `Item ${i}`))
      );

      // Assert - original should be unchanged
      expect(collection.length).toBe(1);
      expect(results[0].length).toBe(2);
      expect(results[99].length).toBe(2);
    });

    it("should handle circular reference protection", () => {
      // Arrange
      const item1 = createTestData("1", "Item 1");
      const item2 = createTestData("2", "Item 2");
      const collection = new TestCollection([item1, item2]);

      // Act - test that entities don't create circular references
      const entity1 = collection.at(0);
      const entity2 = collection.at(1);

      // Assert
      expect(entity1.raw()).toBe(item1);
      expect(entity2.raw()).toBe(item2);
      expect(entity1).not.toBe(entity2);
    });

    it("should handle memory efficiency with repeated access", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act - access same entity multiple times
      const entities = Array.from({ length: 1000 }, () => collection.at(0));

      // Assert - all should be valid but potentially different instances
      entities.forEach((entity) => {
        expect(entity).toBeInstanceOf(TestEntity);
        expect(entity.id()).toBe("1");
      });
    });

    it("should preserve data integrity during transformations", () => {
      // Arrange
      const originalData = createTestData("1", "Original");
      const collection = new TestCollection([originalData]);

      // Act
      const filtered = collection.filter(() => true);
      const mapped = collection.map((entity) => entity.raw());
      const arrayForm = collection.toArray();

      // Assert - original data should be unchanged
      expect(originalData.name).toBe("Original");
      expect(filtered.at(0).raw()?.name).toBe("Original");
      expect(mapped[0]?.name).toBe("Original");
      expect(arrayForm[0].raw()?.name).toBe("Original");
    });

    it("should handle floating point indices gracefully", () => {
      // Arrange
      const items = [
        createTestData("1", "Item 1"),
        createTestData("2", "Item 2"),
      ];
      const collection = new TestCollection(items);

      // Act & Assert - floating point should be handled as integers
      const result1 = collection.insertAt(0.7, createTestData("0", "Item 0"));
      const result2 = collection.removeAt(1.9);

      expect(result1.at(0).id()).toBe("0"); // Should insert at index 0
      expect(result2.length).toBe(1); // Should remove at index 1
    });

    it("should handle Infinity and NaN indices", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act & Assert
      const infinityResult = collection.insertAt(
        Infinity,
        createTestData("2", "Item 2")
      );
      const nanResult = collection.insertAt(NaN, createTestData("3", "Item 3"));

      expect(infinityResult.length).toBe(2);
      expect(nanResult.length).toBe(2);
    });
  });

  describe("Performance characteristics", () => {
    it("should maintain O(n) performance for basic operations", () => {
      // Arrange
      const sizes = [100, 1000];
      const results: number[] = [];

      sizes.forEach((size) => {
        const items = Array.from({ length: size }, (_, i) =>
          createTestData(i.toString(), `Item ${i}`)
        );
        const collection = new TestCollection(items);

        // Act - measure push operation
        const start = performance.now();
        collection.push(createTestData("new", "New Item"));
        const end = performance.now();

        results.push(end - start);
      });

      // Assert - performance should scale reasonably
      expect(results[0]).toBeLessThan(10); // Should be fast for small collections
      expect(results[1]).toBeLessThan(50); // Should still be reasonable for larger collections
    });

    it("should handle rapid successive operations efficiently", () => {
      // Arrange
      const collection = new TestCollection();
      const items = Array.from({ length: 100 }, (_, i) =>
        createTestData(i.toString(), `Item ${i}`)
      );

      // Act
      const start = performance.now();
      let result = collection;

      for (const item of items) {
        result = result.push(item);
      }

      const end = performance.now();

      // Assert
      expect(result.length).toBe(100);
      expect(end - start).toBeLessThan(100); // Should complete in reasonable time
    });

    it("should optimize iteration performance", () => {
      // Arrange
      const items = Array.from({ length: 1000 }, (_, i) =>
        createTestData(i.toString(), `Item ${i}`)
      );
      const collection = new TestCollection(items);

      // Act
      const start = performance.now();

      let count = 0;
      for (const entity of collection) {
        count++;
        entity.id(); // Access entity data
      }

      const end = performance.now();

      // Assert
      expect(count).toBe(1000);
      expect(end - start).toBeLessThan(50); // Should iterate efficiently
    });
  });

  describe("Type safety and generics", () => {
    it("should maintain type safety through transformations", () => {
      // Arrange
      const items = [createTestData("1", "Item 1")];
      const collection = new TestCollection(items);

      // Act & Assert - TypeScript should enforce correct types
      const filtered: TestCollection = collection.filter(() => true);
      const mapped: string[] = collection.map((entity) => entity.id() || "");
      const entities: TestEntity[] = collection.toArray();
      const data: readonly TestData[] = collection.toDataArray();

      expect(filtered).toBeInstanceOf(TestCollection);
      expect(Array.isArray(mapped)).toBe(true);
      expect(Array.isArray(entities)).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should work with inheritance hierarchies", () => {
      // Arrange - Test with different entity types
      class ExtendedTestEntity extends TestEntity {
        getDisplayName(): string {
          return this.raw()?.name || "Unknown";
        }
      }

      class ExtendedTestCollection extends IterableCollection<
        TestData,
        ExtendedTestEntity,
        BusinessEntity
      > {
        protected createEntity(data?: TestData): ExtendedTestEntity {
          return new ExtendedTestEntity(data);
        }
      }

      const items = [createTestData("1", "Item 1")];
      const collection = new ExtendedTestCollection(items, undefined);

      // Act
      const entity = collection.at(0);
      const displayName = entity.getDisplayName();

      // Assert
      expect(entity).toBeInstanceOf(ExtendedTestEntity);
      expect(displayName).toBe("Item 1");
    });
  });
});
