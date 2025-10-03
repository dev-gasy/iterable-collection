import { describe, it, expect } from "vitest";

import { partial } from "../src/partial";
import type { BusinessEntity } from "../src/model/types";
import { Entity } from "../src/model/Entity";
import { Collection } from "../src/model/Collection";

interface TestData extends BusinessEntity {
  name: string;
  value: number;
  nested?: {
    count: number;
    items: string[];
  };
}

class TestEntity extends Entity<TestData> {
  get name(): string {
    return this.raw()?.name || "";
  }

  get numericValue(): number {
    return this.raw()?.value || 0;
  }
}

class TestCollection extends Collection<TestData, TestEntity, BusinessEntity> {
  protected createEntity(data?: TestData): TestEntity {
    return new TestEntity(data);
  }
}

describe('update', () => {

  describe("Entity update method", () => {
    it("should update simple properties immutably", () => {
      // Arrange
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Original",
        value: 42,
      });
      const entity = new TestEntity(originalData);

      // Act
      const updatedEntity = entity.update((draft) => {
        draft.name = "Updated";
        draft.value = 100;
      });

      // Assert
      expect(updatedEntity).not.toBe(entity);
      expect(updatedEntity.name).toBe("Updated");
      expect(updatedEntity.raw()?.value).toBe(100);
      expect(entity.name).toBe("Original");
      expect(entity.raw()?.value).toBe(42);
    });

    it("should update nested objects immutably", () => {
      // Arrange
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Test",
        value: 1,
        nested: {
          count: 5,
          items: ["a", "b"],
        },
      });
      const entity = new TestEntity(originalData);

      // Act
      const updatedEntity = entity.update((draft) => {
        if (draft.nested) {
          draft.nested.count = 10;
          draft.nested.items.push("c");
        }
      });

      // Assert
      expect(updatedEntity).not.toBe(entity);
      expect(updatedEntity.raw()?.nested?.count).toBe(10);
      expect(updatedEntity.raw()?.nested?.items).toEqual(["a", "b", "c"]);
      expect(entity.raw()?.nested?.count).toBe(5);
      expect(entity.raw()?.nested?.items).toEqual(["a", "b"]);
    });

    it("should return same entity when no value exists", () => {
      // Arrange
      const entity = new TestEntity();

      // Act
      const updatedEntity = entity.update((draft) => {
        draft.name = "Updated";
      });

      // Assert
      expect(updatedEntity).toBe(entity);
      expect(updatedEntity.raw()).toBeUndefined();
    });

    it("should preserve entity identity and parent", () => {
      // Arrange
      const parentData = partial<BusinessEntity>({ _key: { id: "parent" } });
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Original",
        value: 42,
      });
      const entity = new TestEntity(originalData, parentData);

      // Act
      const updatedEntity = entity.update((draft) => {
        draft.name = "Updated";
      });

      // Assert
      expect(updatedEntity).not.toBe(entity);
      expect(updatedEntity.id()).toBe("1");
      expect(updatedEntity.name).toBe("Updated");
    });

    it("should handle complex nested updates", () => {
      // Arrange
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Test",
        value: 1,
        nested: {
          count: 1,
          items: ["initial"],
        },
      });
      const entity = new TestEntity(originalData);

      // Act
      const updatedEntity = entity.update((draft) => {
        draft.name = "Updated Test";
        draft.value = 999;
        if (draft.nested) {
          draft.nested.count = draft.nested.count * 2;
          draft.nested.items = draft.nested.items.filter(
              (item) => item !== "initial"
          );
          draft.nested.items.push("new1", "new2");
        }
      });

      // Assert
      expect(updatedEntity.name).toBe("Updated Test");
      expect(updatedEntity.raw()?.value).toBe(999);
      expect(updatedEntity.raw()?.nested?.count).toBe(2);
      expect(updatedEntity.raw()?.nested?.items).toEqual(["new1", "new2"]);

      // Original should be unchanged
      expect(entity.name).toBe("Test");
      expect(entity.raw()?.value).toBe(1);
      expect(entity.raw()?.nested?.count).toBe(1);
      expect(entity.raw()?.nested?.items).toEqual(["initial"]);
    });
  });

  describe("Collection update method", () => {
    it("should update collection items immutably", () => {
      // Arrange
      const initialData = [
        partial<TestData>({ _key: { id: "1" }, name: "First", value: 1 }),
        partial<TestData>({ _key: { id: "2" }, name: "Second", value: 2 }),
      ];
      const collection = new TestCollection(initialData);

      // Act
      const updatedCollection = collection.update((draft) => {
        // Update raw data directly
        draft[0].name = "Updated First";
        draft[1].value = 200;
      });

      // Assert
      expect(updatedCollection).not.toBe(collection);
      expect(updatedCollection.at(0).name).toBe("Updated First");
      expect(updatedCollection.at(1).raw()?.value).toBe(200);
      expect(collection.at(0).name).toBe("First");
      expect(collection.at(1).raw()?.value).toBe(2);
    });

    it("should add items to collection", () => {
      // Arrange
      const initialData = [
        partial<TestData>({ _key: { id: "1" }, name: "First", value: 1 }),
      ];
      const collection = new TestCollection(initialData);

      // Act
      const updatedCollection = collection.update((draft) => {
        draft.push(partial<TestData>({ _key: { id: "2" }, name: "Second", value: 2 }));
      });

      // Assert
      expect(updatedCollection.length).toBe(2);
      expect(updatedCollection.at(1).name).toBe("Second");
      expect(collection.length).toBe(1);
    });

    it("should remove items from collection", () => {
      // Arrange
      const initialData = [
        partial<TestData>({ _key: { id: "1" }, name: "First", value: 1 }),
        partial<TestData>({ _key: { id: "2" }, name: "Second", value: 2 }),
        partial<TestData>({ _key: { id: "3" }, name: "Third", value: 3 }),
      ];
      const collection = new TestCollection(initialData);

      // Act
      const updatedCollection = collection.update((draft) => {
        draft.splice(1, 1); // Remove second item
      });

      // Assert
      expect(updatedCollection.length).toBe(2);
      expect(updatedCollection.at(0).name).toBe("First");
      expect(updatedCollection.at(1).name).toBe("Third");
      expect(collection.length).toBe(3);
    });

    it("should reorder items in collection", () => {
      // Arrange
      const initialData = [
        partial<TestData>({ _key: { id: "1" }, name: "First", value: 1 }),
        partial<TestData>({ _key: { id: "2" }, name: "Second", value: 2 }),
        partial<TestData>({ _key: { id: "3" }, name: "Third", value: 3 }),
      ];
      const collection = new TestCollection(initialData);

      // Act
      const updatedCollection = collection.update((draft) => {
        // Move first item to the end
        const firstItem = draft.shift();
        if (firstItem) {
          draft.push(firstItem);
        }
      });

      // Assert
      expect(updatedCollection.length).toBe(3);
      expect(updatedCollection.at(0).name).toBe("Second");
      expect(updatedCollection.at(1).name).toBe("Third");
      expect(updatedCollection.at(2).name).toBe("First");
      expect(collection.at(0).name).toBe("First");
    });

    it("should handle complex bulk updates", () => {
      // Arrange
      const initialData = [
        partial<TestData>({ _key: { id: "1" }, name: "Task 1", value: 10 }),
        partial<TestData>({ _key: { id: "2" }, name: "Task 2", value: 20 }),
        partial<TestData>({ _key: { id: "3" }, name: "Task 3", value: 30 }),
      ];
      const collection = new TestCollection(initialData);

      // Act
      const updatedCollection = collection.update((draft) => {
        // Update all values to be double using direct data modification
        for (let i = 0; i < draft.length; i++) {
          draft[i].value = draft[i].value * 2;
        }

        // Add a new item
        draft.push(partial<TestData>({ _key: { id: "4" }, name: "Task 4", value: 80 }));

        // Remove the first item
        draft.shift();
      });

      // Assert
      expect(updatedCollection.length).toBe(3);
      expect(updatedCollection.at(0).name).toBe("Task 2");
      expect(updatedCollection.at(0).raw()?.value).toBe(40);
      expect(updatedCollection.at(1).raw()?.value).toBe(60);
      expect(updatedCollection.at(2).name).toBe("Task 4");

      // Original should be unchanged
      expect(collection.length).toBe(3);
      expect(collection.at(0).name).toBe("Task 1");
      expect(collection.at(0).raw()?.value).toBe(10);
    });

    it("should work with empty collection", () => {
      // Arrange
      const collection = new TestCollection();

      // Act
      const updatedCollection = collection.update((draft) => {
        draft.push(partial<TestData>({ _key: { id: "1" }, name: "New Item", value: 100 }));
      });

      // Assert
      expect(updatedCollection.length).toBe(1);
      expect(updatedCollection.at(0).name).toBe("New Item");
      expect(collection.length).toBe(0);
    });
  });

});