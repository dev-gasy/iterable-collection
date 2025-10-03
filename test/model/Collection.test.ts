import { describe, it, expect } from "vitest";
import { Collection } from "../../src/model/Collection";
import { Entity } from "../../src/model/Entity";
import type { BusinessEntity } from "../../src/model/types";
import { partial } from "../../src/partial";

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
  protected createEntity(data: TestData): TestEntity {
    return new TestEntity(data);
  }
}

describe("Collection", () => {
  describe("constructor", () => {
    it("should create empty collection", () => {
      const collection = new TestCollection();
      expect(collection.length).toBe(0);
      expect(collection.isEmpty).toBe(true);
    });

    it("should create collection with values", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);

      expect(collection.length).toBe(2);
      expect(collection.isEmpty).toBe(false);
    });

    it("should freeze values array", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);

      expect(Object.isFrozen(collection.raw())).toBe(true);
    });
  });

  describe("raw", () => {
    it("should return immutable raw values", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);
      const raw = collection.raw();

      expect(raw).toEqual(data);
      expect(Object.isFrozen(raw)).toBe(true);
    });
  });

  describe("at", () => {
    it("should return entity at index", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const entity = collection.at(1);

      expect(entity.name).toBe("Item 2");
      expect(entity.numericValue).toBe(20);
    });
  });

  describe("length", () => {
    it("should return correct length", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);

      expect(collection.length).toBe(1);
    });
  });

  describe("isEmpty", () => {
    it("should return true for empty collection", () => {
      const collection = new TestCollection();

      expect(collection.isEmpty).toBe(true);
    });

    it("should return false for non-empty collection", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);

      expect(collection.isEmpty).toBe(false);
    });
  });

  describe("toArray", () => {
    it("should return array of entities", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const array = collection.toArray();

      expect(array).toHaveLength(2);
      expect(array[0].name).toBe("Item 1");
      expect(array[1].name).toBe("Item 2");
    });
  });

  describe("filter", () => {
    it("should filter items", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
        partial<TestData>({ _key: { id: "3", rootId: "root", revisionNo: 1 }, name: "Item 3", value: 30 }),
      ];

      const collection = new TestCollection(data);
      const filtered = collection.filter((entity) => entity.numericValue > 15);

      expect(filtered.length).toBe(2);
      expect(filtered.at(0).name).toBe("Item 2");
      expect(filtered.at(1).name).toBe("Item 3");
    });

    it("should pass index to predicate", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const filtered = collection.filter((_, index) => index === 0);

      expect(filtered.length).toBe(1);
      expect(filtered.at(0).name).toBe("Item 1");
    });
  });

  describe("map", () => {
    it("should map entities to values", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const mapped = collection.map((entity) => entity.name);

      expect(mapped).toEqual(["Item 1", "Item 2"]);
    });

    it("should pass index to mapper", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const mapped = collection.map((entity, index) => `${index}: ${entity.name}`);

      expect(mapped).toEqual(["0: Item 1", "1: Item 2"]);
    });
  });

  describe("reduce", () => {
    it("should reduce entities to single value", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
        partial<TestData>({ _key: { id: "3", rootId: "root", revisionNo: 1 }, name: "Item 3", value: 30 }),
      ];

      const collection = new TestCollection(data);
      const sum = collection.reduce((acc, entity) => acc + entity.numericValue, 0);

      expect(sum).toBe(60);
    });

    it("should pass index to reducer", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const result = collection.reduce((acc, entity, index) => {
        acc.push(`${index}: ${entity.name}`);
        return acc;
      }, [] as string[]);

      expect(result).toEqual(["0: Item 1", "1: Item 2"]);
    });
  });

  describe("update", () => {
    it("should update collection immutably", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const updated = collection.update((draft) => {
        draft[0].name = "Updated Item 1";
        draft.push(partial<TestData>({ _key: { id: "3", rootId: "root", revisionNo: 1 }, name: "Item 3", value: 30 }));
      });

      expect(updated).not.toBe(collection);
      expect(updated.length).toBe(3);
      expect(updated.at(0).name).toBe("Updated Item 1");
      expect(updated.at(2).name).toBe("Item 3");
      expect(collection.length).toBe(2);
      expect(collection.at(0).name).toBe("Item 1");
    });
  });

  describe("copy", () => {
    it("should create shallow copy", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);
      const copy = collection.copy();

      expect(copy).not.toBe(collection);
      expect(copy.length).toBe(collection.length);
      expect(copy.at(0).name).toBe(collection.at(0).name);
    });
  });

  describe("iteration", () => {
    it("should be iterable", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const names: string[] = [];
      for (const entity of collection) {
        names.push(entity.name);
      }

      expect(names).toEqual(["Item 1", "Item 2"]);
    });

    it("should work with spread operator", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item 1", value: 10 }),
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "Item 2", value: 20 }),
      ];

      const collection = new TestCollection(data);
      const entities = [...collection];

      expect(entities).toHaveLength(2);
      expect(entities[0].name).toBe("Item 1");
      expect(entities[1].name).toBe("Item 2");
    });
  });

  describe("create method", () => {
    it("should create new instance with same type", () => {
      const data = [
        partial<TestData>({ _key: { id: "1", rootId: "root", revisionNo: 1 }, name: "Item", value: 10 }),
      ];

      const collection = new TestCollection(data);
      const newData = [
        partial<TestData>({ _key: { id: "2", rootId: "root", revisionNo: 1 }, name: "New Item", value: 20 }),
      ];
      const newCollection = collection.create(newData);

      expect(newCollection).toBeInstanceOf(TestCollection);
      expect(newCollection.length).toBe(1);
      expect(newCollection.at(0).name).toBe("New Item");
    });
  });
});