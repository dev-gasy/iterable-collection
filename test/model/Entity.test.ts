import { describe, it, expect } from "vitest";
import { Entity, type  BusinessEntity } from "../../src/model";
import { partial } from "../../src/partial";

interface TestData extends BusinessEntity {
  name: string;
  value: number;
  nested?: {
    count: number;
    items: string[];
  };
}

interface ParentData extends BusinessEntity {
  parentName: string;
}

class TestEntity extends Entity<TestData, ParentData> {
  get displayName(): string {
    return this.raw()?.name || "Unknown";
  }

  get numericValue(): number {
    return this.raw()?.value || 0;
  }
}

describe("Entity", () => {
  describe("constructor", () => {
    it("should create entity with undefined value", () => {
      const entity = new TestEntity();

      expect(entity.exists()).toBe(false);
      expect(entity.isEmpty()).toBe(true);
      expect(entity.raw()).toBeUndefined();
    });

    it("should create entity with value", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.exists()).toBe(true);
      expect(entity.isEmpty()).toBe(false);
      expect(entity.raw()).toEqual(data);
    });

    it("should create entity with parent", () => {
      const parentData = partial<ParentData>({
        _key: { id: "parent", rootId: "root", revisionNo: 1 },
        parentName: "Parent",
      });
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data, parentData);

      expect(entity.exists()).toBe(true);
      expect(entity.raw()).toEqual(data);
    });

    it("should freeze value and parent", () => {
      const parentData = partial<ParentData>({
        _key: { id: "parent", rootId: "root", revisionNo: 1 },
        parentName: "Parent",
      });
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data, parentData);

      expect(Object.isFrozen(entity.raw())).toBe(true);
    });
  });

  describe("name", () => {
    it("should return name from value", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.name).toBe("Test Item");
    });

    it("should return undefined for empty entity", () => {
      const entity = new TestEntity();

      expect(entity.name).toBeUndefined();
    });
  });

  describe("id", () => {
    it("should return id from key", () => {
      const data = partial<TestData>({
        _key: { id: "test-id", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.id()).toBe("test-id");
    });

    it("should return undefined for empty entity", () => {
      const entity = new TestEntity();

      expect(entity.id()).toBeUndefined();
    });

    it("should return undefined when key has no id", () => {
      const data = partial<TestData>({
        _key: { rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.id()).toBeUndefined();
    });
  });

  describe("exists", () => {
    it("should return true when entity has value", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.exists()).toBe(true);
    });

    it("should return false when entity has no value", () => {
      const entity = new TestEntity();

      expect(entity.exists()).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("should return false when entity has value", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.isEmpty()).toBe(false);
    });

    it("should return true when entity has no value", () => {
      const entity = new TestEntity();

      expect(entity.isEmpty()).toBe(true);
    });
  });

  describe("raw", () => {
    it("should return raw data", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(entity.raw()).toEqual(data);
    });

    it("should return undefined for empty entity", () => {
      const entity = new TestEntity();

      expect(entity.raw()).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update entity immutably", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Original",
        value: 42,
      });
      const entity = new TestEntity(data);
      const updated = entity.update((draft) => {
        draft.name = "Updated";
        draft.value = 100;
      });

      expect(updated).not.toBe(entity);
      expect(updated.displayName).toBe("Updated");
      expect(updated.numericValue).toBe(100);
      expect(entity.displayName).toBe("Original");
      expect(entity.numericValue).toBe(42);
    });

    it("should update nested properties", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test",
        value: 1,
        nested: {
          count: 5,
          items: ["a", "b"],
        },
      });
      const entity = new TestEntity(data);
      const updated = entity.update((draft) => {
        if (draft.nested) {
          draft.nested.count = 10;
          draft.nested.items.push("c");
        }
      });

      expect(updated.raw()?.nested?.count).toBe(10);
      expect(updated.raw()?.nested?.items).toEqual(["a", "b", "c"]);
      expect(entity.raw()?.nested?.count).toBe(5);
      expect(entity.raw()?.nested?.items).toEqual(["a", "b"]);
    });

    it("should return same entity when no value exists", () => {
      const entity = new TestEntity();
      const updated = entity.update((draft) => {
        draft.name = "Updated";
      });

      expect(updated).toBe(entity);
      expect(updated.raw()).toBeUndefined();
    });

    it("should preserve parent in updated entity", () => {
      const parentData = partial<ParentData>({
        _key: { id: "parent", rootId: "root", revisionNo: 1 },
        parentName: "Parent",
      });
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Original",
        value: 42,
      });
      const entity = new TestEntity(data, parentData);
      const updated = entity.update((draft) => {
        draft.name = "Updated";
      });

      expect(updated).not.toBe(entity);
      expect(updated.displayName).toBe("Updated");
      expect(updated.id()).toBe("1");
    });

    it("should handle complex nested updates", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test",
        value: 1,
        nested: {
          count: 1,
          items: ["initial"],
        },
      });
      const entity = new TestEntity(data);
      const updated = entity.update((draft) => {
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

      expect(updated.displayName).toBe("Updated Test");
      expect(updated.raw()?.value).toBe(999);
      expect(updated.raw()?.nested?.count).toBe(2);
      expect(updated.raw()?.nested?.items).toEqual(["new1", "new2"]);

      expect(entity.displayName).toBe("Test");
      expect(entity.raw()?.value).toBe(1);
      expect(entity.raw()?.nested?.count).toBe(1);
      expect(entity.raw()?.nested?.items).toEqual(["initial"]);
    });
  });

  describe("copy", () => {
    it("should create exact copy", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });
      const entity = new TestEntity(data);
      const copy = entity.copy();

      expect(copy).not.toBe(entity);
      expect(copy.raw()).toEqual(entity.raw());
      expect(copy.id()).toBe(entity.id());
      expect(copy.name).toBe(entity.name);
    });

    it("should copy empty entity", () => {
      const entity = new TestEntity();
      const copy = entity.copy();

      expect(copy).not.toBe(entity);
      expect(copy.raw()).toBeUndefined();
      expect(copy.exists()).toBe(false);
    });

    it("should preserve parent in copy", () => {
      const parentData = partial<ParentData>({
        _key: { id: "parent", rootId: "root", revisionNo: 1 },
        parentName: "Parent",
      });
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });
      const entity = new TestEntity(data, parentData);
      const copy = entity.copy();

      expect(copy).not.toBe(entity);
      expect(copy.raw()).toEqual(entity.raw());
    });
  });

  describe("inheritance from Pipeable", () => {
    it("should have pipe method", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });

      const entity = new TestEntity(data);

      expect(typeof entity.pipe).toBe("function");
    });

    it("should work with pipe method", () => {
      const data = partial<TestData>({
        _key: { id: "1", rootId: "root", revisionNo: 1 },
        name: "Test Item",
        value: 42,
      });
      const entity = new TestEntity(data);

      const result = entity.pipe(
        (e) => e.numericValue,
        (value) => value * 2
      );

      expect(result).toBe(84);
    });
  });
});