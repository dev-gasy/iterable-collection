import { describe, it, expect } from "vitest";
import type { Key, BusinessEntity, EntityConstructor, CollectionConstructor } from "../../src/model";

describe("types", () => {
  describe("Key interface", () => {
    it("should define required properties", () => {
      const key: Key = {
        rootId: "root-123",
        revisionNo: 1,
        id: "entity-456"
      };

      expect(key.rootId).toBe("root-123");
      expect(key.revisionNo).toBe(1);
      expect(key.id).toBe("entity-456");
    });

    it("should allow id to be optional", () => {
      const key: Key = {
        rootId: "root-123",
        revisionNo: 1
      };

      expect(key.rootId).toBe("root-123");
      expect(key.revisionNo).toBe(1);
      expect(key.id).toBeUndefined();
    });

    it("should have readonly properties at compile time", () => {
      const key: Key = {
        rootId: "root",
        revisionNo: 1,
        id: "test"
      };

      expect(key.rootId).toBe("root");
      expect(key.revisionNo).toBe(1);
      expect(key.id).toBe("test");
    });
  });

  describe("BusinessEntity interface", () => {
    it("should define required _key property", () => {
      const entity: BusinessEntity = {
        _key: {
          rootId: "root-123",
          revisionNo: 1,
          id: "entity-456"
        },
        name: "Test Entity"
      };

      expect(entity._key).toBeDefined();
      expect(entity._key.rootId).toBe("root-123");
      expect(entity.name).toBe("Test Entity");
    });

    it("should allow name to be optional", () => {
      const entity: BusinessEntity = {
        _key: {
          rootId: "root-123",
          revisionNo: 1
        }
      };

      expect(entity._key).toBeDefined();
      expect(entity.name).toBeUndefined();
    });

    it("should have readonly properties at compile time", () => {
      const entity: BusinessEntity = {
        _key: {
          rootId: "root",
          revisionNo: 1
        },
        name: "Test"
      };

      expect(entity._key.rootId).toBe("root");
      expect(entity.name).toBe("Test");
    });
  });

  describe("EntityConstructor interface", () => {
    interface TestData extends BusinessEntity {
      value: number;
    }

    interface ParentData extends BusinessEntity {
      parentValue: string;
    }

    class TestEntity {
      public parent?: ParentData;

      public value?: TestData;

      constructor(value?: TestData, parent?: ParentData) {
        this.value = value;
        this.parent = parent;
      }
    }

    it("should type check entity constructor", () => {
      const constructor: EntityConstructor<TestData, ParentData, TestEntity> = TestEntity;
      
      const testData: TestData = {
        _key: { rootId: "root", revisionNo: 1 },
        value: 42
      };
      
      const parentData: ParentData = {
        _key: { rootId: "root", revisionNo: 1 },
        parentValue: "parent"
      };

      const instance = new constructor(testData, parentData);
      expect(instance).toBeInstanceOf(TestEntity);
      expect(instance.value).toEqual(testData);
      expect(instance.parent).toEqual(parentData);
    });

    it("should allow optional parameters", () => {
      const constructor: EntityConstructor<TestData, ParentData, TestEntity> = TestEntity;
      
      const instance1 = new constructor();
      expect(instance1).toBeInstanceOf(TestEntity);
      expect(instance1.value).toBeUndefined();
      expect(instance1.parent).toBeUndefined();

      const testData: TestData = {
        _key: { rootId: "root", revisionNo: 1 },
        value: 42
      };
      
      const instance2 = new constructor(testData);
      expect(instance2).toBeInstanceOf(TestEntity);
      expect(instance2.value).toEqual(testData);
      expect(instance2.parent).toBeUndefined();
    });
  });

  describe("CollectionConstructor interface", () => {
    interface TestData extends BusinessEntity {
      value: number;
    }

    interface ParentData extends BusinessEntity {
      parentValue: string;
    }

    class TestCollection {
      public values: readonly TestData[];

      public parent?: ParentData;

      constructor(values: readonly TestData[], parent?: ParentData) {
        this.parent = parent;
        this.values = values;
      }
    }

    it("should type check collection constructor", () => {
      const constructor: CollectionConstructor<TestData, ParentData, TestCollection> = TestCollection;
      
      const testData: TestData[] = [
        { _key: { rootId: "root", revisionNo: 1 }, value: 1 },
        { _key: { rootId: "root", revisionNo: 1 }, value: 2 }
      ];
      
      const parentData: ParentData = {
        _key: { rootId: "root", revisionNo: 1 },
        parentValue: "parent"
      };

      const instance = new constructor(testData, parentData);
      expect(instance).toBeInstanceOf(TestCollection);
      expect(instance.values).toEqual(testData);
      expect(instance.parent).toEqual(parentData);
    });

    it("should require values array", () => {
      const constructor: CollectionConstructor<TestData, ParentData, TestCollection> = TestCollection;
      
      const testData: TestData[] = [];
      const instance = new constructor(testData);
      
      expect(instance).toBeInstanceOf(TestCollection);
      expect(instance.values).toEqual([]);
      expect(instance.parent).toBeUndefined();
    });

    it("should enforce readonly values array", () => {
      const constructor: CollectionConstructor<TestData, ParentData, TestCollection> = TestCollection;
      
      const testData: readonly TestData[] = [
        { _key: { rootId: "root", revisionNo: 1 }, value: 1 }
      ];
      
      const instance = new constructor(testData);
      expect(instance.values).toEqual(testData);
    });
  });

  describe("Type compatibility", () => {
    it("should ensure BusinessEntity extends base structure", () => {
      interface CustomEntity extends BusinessEntity {
        customField: string;
        nestedData?: {
          items: string[];
          count: number;
        };
      }

      const entity: CustomEntity = {
        _key: {
          rootId: "custom-root",
          revisionNo: 2,
          id: "custom-id"
        },
        name: "Custom Entity",
        customField: "custom value",
        nestedData: {
          items: ["item1", "item2"],
          count: 2
        }
      };

      expect(entity._key.rootId).toBe("custom-root");
      expect(entity.name).toBe("Custom Entity");
      expect(entity.customField).toBe("custom value");
      expect(entity.nestedData?.count).toBe(2);
    });

    it("should ensure Key can be extended", () => {
      interface ExtendedKey extends Key {
        metadata?: Record<string, any>;
      }

      const key: ExtendedKey = {
        rootId: "root",
        revisionNo: 1,
        id: "test",
        metadata: {
          created: new Date(),
          source: "test"
        }
      };

      expect(key.rootId).toBe("root");
      expect(key.metadata?.source).toBe("test");
    });
  });
});