import { describe, it, expect } from "vitest";
import { Pipeable } from "../../src/model";

class TestPipeable extends Pipeable {
  public value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  double(): TestPipeable {
    return new TestPipeable(this.value * 2);
  }
}

describe("Pipeable", () => {
  describe("pipe with single function", () => {
    it("should apply single function", () => {
      const pipeable = new TestPipeable(5);
      const result = pipeable.pipe((p) => p.getValue());
      expect(result).toBe(5);
    });

    it("should transform to different type", () => {
      const pipeable = new TestPipeable(10);
      const result = pipeable.pipe((p) => p.getValue().toString());
      expect(result).toBe("10");
    });
  });

  describe("pipe with two functions", () => {
    it("should apply functions in sequence", () => {
      const pipeable = new TestPipeable(5);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value * 3
      );
      expect(result).toBe(15);
    });

    it("should handle type transformations", () => {
      const pipeable = new TestPipeable(42);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => `Value: ${value}`
      );
      expect(result).toBe("Value: 42");
    });
  });

  describe("pipe with three functions", () => {
    it("should apply all functions in sequence", () => {
      const pipeable = new TestPipeable(2);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value * 5,
        (value) => value + 10
      );
      expect(result).toBe(20);
    });
  });

  describe("pipe with four functions", () => {
    it("should apply all functions in sequence", () => {
      const pipeable = new TestPipeable(3);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value * 2,
        (value) => value + 1,
        (value) => value.toString()
      );
      expect(result).toBe("7");
    });
  });

  describe("pipe with five functions", () => {
    it("should apply all functions in sequence", () => {
      const pipeable = new TestPipeable(1);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value + 9,
        (value) => value / 2,
        (value) => value * 3,
        (value) => Math.floor(value)
      );
      expect(result).toBe(15);
    });
  });

  describe("pipe with method chaining", () => {
    it("should work with method returns", () => {
      const pipeable = new TestPipeable(4);
      const result = pipeable.pipe(
        (p) => p.double(),
        (p) => p.double(),
        (p) => p.getValue()
      );
      expect(result).toBe(16);
    });
  });

  describe("pipe with complex transformations", () => {
    it("should handle array operations", () => {
      const pipeable = new TestPipeable(3);
      const result = pipeable.pipe(
        (p) => [p.getValue(), p.getValue() * 2, p.getValue() * 3],
        (arr) => arr.reduce((sum, val) => sum + val, 0),
        (sum) => sum / 3
      );
      expect(result).toBe(6);
    });

    it("should handle object transformations", () => {
      const pipeable = new TestPipeable(7);
      const result = pipeable.pipe(
        (p) => ({ original: p.getValue(), doubled: p.getValue() * 2 }),
        (obj) => obj.original + obj.doubled,
        (sum) => sum > 20
      );
      expect(result).toBe(true);
    });
  });

  describe("pipe edge cases", () => {
    it("should handle zero value", () => {
      const pipeable = new TestPipeable(0);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value || 1,
        (value) => value * 100
      );
      expect(result).toBe(100);
    });

    it("should handle negative values", () => {
      const pipeable = new TestPipeable(-5);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => Math.abs(value),
        (value) => value * 2
      );
      expect(result).toBe(10);
    });

    it("should handle functions that return undefined", () => {
      const pipeable = new TestPipeable(10);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value > 5 ? value : undefined,
        (value) => value ?? 0
      );
      expect(result).toBe(10);
    });
  });

  describe("pipe with longer chains", () => {
    it("should work with 6 functions", () => {
      const pipeable = new TestPipeable(1);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (v) => v + 1,
        (v) => v * 2,
        (v) => v + 3,
        (v) => v * 4,
        (v) => v - 1
      );
      expect(result).toBe(27);
    });

    it("should work with 10 functions", () => {
      const pipeable = new TestPipeable(2);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (v) => v + 1,
        (v) => v * 2,
        (v) => v + 1,
        (v) => v * 2,
        (v) => v + 1,
        (v) => v * 2,
        (v) => v + 1,
        (v) => v * 2,
        (v) => v.toString()
      );
      expect(result).toBe("62");
    });

    it("should work with maximum 16 functions", () => {
      const pipeable = new TestPipeable(1);
      const result = pipeable.pipe(
        (p) => p.getValue(),
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v + 1,
        (v) => v * 2
      );
      expect(result).toBe(30);
    });
  });

  describe("pipe type safety", () => {
    it("should maintain type safety through transformations", () => {
      const pipeable = new TestPipeable(5);
      
      const stringResult: string = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value.toString()
      );
      expect(stringResult).toBe("5");

      const booleanResult: boolean = pipeable.pipe(
        (p) => p.getValue(),
        (value) => value > 3
      );
      expect(booleanResult).toBe(true);

      const arrayResult: number[] = pipeable.pipe(
        (p) => p.getValue(),
        (value) => [value, value * 2, value * 3]
      );
      expect(arrayResult).toEqual([5, 10, 15]);
    });
  });
});