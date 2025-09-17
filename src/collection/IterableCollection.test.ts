import { describe, it, expect } from "vitest";
import { TestCollection, TestEntity, type TestData } from "./TestCollection.ts";

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
  });
});
