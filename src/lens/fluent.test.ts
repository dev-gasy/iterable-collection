import { describe, it, expect } from "vitest";
import { navigate, $, FluentNavigator } from "./fluent.ts";

// Complex data structure interfaces for testing
interface RiskItem {
  vin: string;
  make: string;
  model: string;
  year: number;
}

interface Owned {
  riskItems: RiskItem[];
  totalValue: number;
}

interface Party {
  id: string;
  name: string;
  owned: Owned;
}

interface Quote {
  id: string;
  parties: Party[];
  premium: number;
}

interface ComplexData {
  quote: Quote;
  metadata: {
    created: string;
    version: number;
  };
}

describe("FluentNavigator", () => {
  const createComplexData = (): ComplexData => ({
    quote: {
      id: "Q123",
      parties: [
        {
          id: "P1",
          name: "John Doe",
          owned: {
            riskItems: [
              {
                vin: "1HGBH41JXMN109186",
                make: "Honda",
                model: "Civic",
                year: 2021,
              },
              {
                vin: "2T1BURHE0JC014872",
                make: "Toyota",
                model: "Corolla",
                year: 2018,
              },
            ],
            totalValue: 45000,
          },
        },
        {
          id: "P2",
          name: "Jane Smith",
          owned: {
            riskItems: [
              {
                vin: "WBAVA37553NM36040",
                make: "BMW",
                model: "3 Series",
                year: 2020,
              },
            ],
            totalValue: 35000,
          },
        },
      ],
      premium: 1200,
    },
    metadata: {
      created: "2024-01-15",
      version: 1,
    },
  });

  describe("constructor and factory functions", () => {
    it("should create navigator with navigate function", () => {
      const data = { foo: "bar" };
      const nav = navigate(data);
      
      expect(nav).toBeInstanceOf(FluentNavigator);
      expect(nav.getValue()).toBe(data);
    });

    it("should create navigator with $ alias", () => {
      const data = { foo: "bar" };
      const nav = $(data);
      
      expect(nav).toBeInstanceOf(FluentNavigator);
      expect(nav.getValue()).toBe(data);
    });
  });

  describe("get method", () => {
    it("should navigate to nested properties safely", () => {
      const data = createComplexData();
      
      const quoteId = navigate(data)
        .get("quote")
        .get("id")
        .or("No ID");
      
      expect(quoteId).toBe("Q123");
    });

    it("should handle missing properties gracefully", () => {
      const data: any = { quote: null };
      
      const premium = navigate(data)
        .get("quote")
        .get("premium")
        .or(0);
      
      expect(premium).toBe(0);
    });

    it("should navigate to deeply nested properties", () => {
      const data = createComplexData();

      const firstVin = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("riskItems")
        .at(0)
        .get("vin")
        .or("Unknown VIN");

      expect(firstVin).toBe("1HGBH41JXMN109186");
    });

    it("should handle null/undefined intermediate values", () => {
      const data: any = {
        quote: {
          parties: null,
        },
      };

      const result = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("name")
        .or("No name");

      expect(result).toBe("No name");
    });
  });

  describe("at method", () => {
    it("should access array elements safely", () => {
      const data = createComplexData();

      const firstPartyName = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("name")
        .or("Unknown");

      expect(firstPartyName).toBe("John Doe");
    });

    it("should handle out-of-bounds array access", () => {
      const data = createComplexData();

      const nonExistentParty = navigate(data)
        .get("quote")
        .get("parties")
        .at(10)
        .get("name")
        .or("Not found");

      expect(nonExistentParty).toBe("Not found");
    });

    it("should handle negative array indices", () => {
      const data = createComplexData();

      const result = navigate(data)
        .get("quote")
        .get("parties")
        .at(-1)
        .get("name")
        .or("Not found");

      expect(result).toBe("Not found");
    });

    it("should handle non-array values", () => {
      const data = { notAnArray: "string" };
      
      const result = navigate(data)
        .get("notAnArray")
        .at(0)
        .or("Default");
      
      expect(result).toBe("Default");
    });
  });

  describe("transform method", () => {
    it("should transform values when they exist", () => {
      const data = createComplexData();
      
      const formattedPremium = navigate(data)
        .get("quote")
        .get("premium")
        .transform((p: number) => `$${p.toFixed(2)}`)
        .or("No premium");
      
      expect(formattedPremium).toBe("$1200.00");
    });

    it("should handle null values in transform", () => {
      const data: any = { quote: null };
      
      const result = navigate(data)
        .get("quote")
        .get("premium")
        .transform((p: any) => `$${(p as number).toFixed(2)}`)
        .or("No premium");
      
      expect(result).toBe("No premium");
    });

    it("should handle transform errors gracefully", () => {
      const data = { value: "not a number" };
      
      const result = navigate(data)
        .get("value")
        .transform((v: any) => v.toFixed(2)) // Will throw error
        .or("Error occurred");
      
      expect(result).toBe("Error occurred");
    });

    it("should chain multiple transforms", () => {
      const data = { numbers: [1, 2, 3, 4, 5] };
      
      const result = navigate(data)
        .get("numbers")
        .transform((arr: number[]) => arr.filter((n: number) => n % 2 === 0))
        .transform((arr: number[]) => arr.map((n: number) => n * 2))
        .transform((arr: number[]) => arr.join(","))
        .or("No result");
      
      expect(result).toBe("4,8");
    });
  });

  describe("exists method", () => {
    it("should return true for existing values", () => {
      const data = createComplexData();
      
      const hasQuote = navigate(data)
        .get("quote")
        .exists();
      
      expect(hasQuote).toBe(true);
    });

    it("should return false for null/undefined values", () => {
      const data: any = { quote: null };
      
      const hasQuoteId = navigate(data)
        .get("quote")
        .get("id")
        .exists();
      
      expect(hasQuoteId).toBe(false);
    });

    it("should work with nested navigation", () => {
      const data = createComplexData();
      
      const items = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("riskItems")
          .or([])
      
      expect(items.length).toBe(2);
    });
  });

  describe("or method", () => {
    it("should return original value when it exists", () => {
      const data = createComplexData();
      
      const version = navigate(data)
        .get("metadata")
        .get("version")
        .or(0);
      
      expect(version).toBe(1);
    });

    it("should return default value when original is null", () => {
      const data: any = { metadata: null };
      
      const version = navigate(data)
        .get("metadata")
        .get("version")
        .or(999);
      
      expect(version).toBe(999);
    });

    it("should work with complex default values", () => {
      const data: any = { quote: null };
      
      const defaultQuote = { id: "DEFAULT", premium: 0 };
      const quote = navigate(data)
        .get("quote")
        .or(defaultQuote);
      
      expect(quote).toEqual(defaultQuote);
    });
  });

  describe("getValue method", () => {
    it("should return the raw value", () => {
      const data = createComplexData();
      
      const quote = navigate(data)
        .get("quote")
        .getValue();
      
      expect(quote).toBe(data.quote);
    });

    it("should return null for missing values", () => {
      const data: any = { quote: null };
      
      const parties = navigate(data)
        .get("quote")
        .get("parties")
        .getValue();
      
      expect(parties).toBe(null);
    });
  });

  describe("toString method", () => {
    it("should convert values to string", () => {
      const data = { number: 42 };
      
      const str = navigate(data)
        .get("number")
        .toString();
      
      expect(str).toBe("42");
    });

    it("should handle null values", () => {
      const data: any = { value: null };
      
      const str = navigate(data)
        .get("value")
        .toString();
      
      expect(str).toBe("null");
    });
  });

  describe("array methods with improved type inference", () => {
    it("should filter arrays with proper typing", () => {
      const data = createComplexData();
      
      const expensiveVehicles = navigate(data)
        .get("quote")
        .get("parties")
        .at<Party>(0)
        .get("owned")
        .get("riskItems")
        .filter((item) => item.year > 2019)
        .getValue();
      
      expect(expensiveVehicles).toHaveLength(1);
      expect(expensiveVehicles?.[0]?.make).toBe("Honda");
    });

    it("should find array elements with proper typing", () => {
      const data = createComplexData();
      
      const toyotaVehicle = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("riskItems")
        .find((item) => item.make === "Toyota")
        .getValue();
      
      expect(toyotaVehicle?.model).toBe("Corolla");
      expect(toyotaVehicle?.year).toBe(2018);
    });

    it("should map array elements with proper typing", () => {
      const data = createComplexData();
      
      const vehicleDescriptions = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("riskItems")
        .map((item) => `${item.year} ${item.make} ${item.model}`)
        .getValue();
      
      expect(vehicleDescriptions).toEqual([
        "2021 Honda Civic",
        "2018 Toyota Corolla"
      ]);
    });

    it("should chain array operations with proper typing", () => {
      const data = createComplexData();
      
      const recentVehicleCount = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("riskItems")
        .filter((item) => item.year >= 2020)
        .map((item) => item.make)
        .transform((makes) => makes.length)
        .or(0);
      
      expect(recentVehicleCount).toBe(1);
    });
  });

  describe("existsWhere and tap methods", () => {
    it("should check existence with predicate", () => {
      const data = createComplexData();
      
      const hasExpensiveVehicle = navigate(data)
        .get("quote")
        .get("parties")
        .at(0)
        .get("owned")
        .get("totalValue")
        .existsWhere((value: number) => value > 40000);
      
      expect(hasExpensiveVehicle).toBe(true);
    });

    it("should execute side effects with tap", () => {
      const data = createComplexData();
      const sideEffects: string[] = [];
      
      const result = navigate(data)
        .get("quote")
        .tap((quote) => sideEffects.push(`Processing quote ${quote.id}`))
        .get("parties")
        .tap((parties) => sideEffects.push(`Found ${parties.length} parties`))
        .at(0)
        .tap((party) => sideEffects.push(`Processing party ${party.name}`))
        .get("name")
        .or("Unknown");
      
      expect(result).toBe("John Doe");
      expect(sideEffects).toEqual([
        "Processing quote Q123",
        "Found 2 parties",
        "Processing party John Doe"
      ]);
    });
  });

  describe("complex real-world scenarios", () => {
    it("should safely extract multiple vehicle details", () => {
      const data = createComplexData();
      
      const vehicles = [];
      
      // Extract all vehicle VINs safely
      for (let partyIndex = 0; partyIndex < 2; partyIndex++) {
        const party = navigate(data)
          .get("quote")
          .get("parties")
          .at(partyIndex);
        
        if (party.exists()) {
          const riskItems = party
            .get("owned")
            .get("riskItems")
            .getValue();
          
          if (Array.isArray(riskItems)) {
            for (let itemIndex = 0; itemIndex < riskItems.length; itemIndex++) {
              const vehicle = party
                .get("owned")
                .get("riskItems")
                .at(itemIndex);
              
              if (vehicle.exists()) {
                vehicles.push({
                  vin: vehicle.get("vin").or("Unknown"),
                  make: vehicle.get("make").or("Unknown"),
                  model: vehicle.get("model").or("Unknown"),
                  year: vehicle.get("year").or(0),
                });
              }
            }
          }
        }
      }
      
      expect(vehicles).toHaveLength(3);
      expect(vehicles[0]).toEqual({
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Civic",
        year: 2021,
      });
      expect(vehicles[2]).toEqual({
        vin: "WBAVA37553NM36040",
        make: "BMW",
        model: "3 Series",
        year: 2020,
      });
    });

    it("should calculate total value across all parties", () => {
      const data = createComplexData();
      
      let totalValue = 0;
      
      const parties = navigate(data)
        .get("quote")
        .get("parties")
        .getValue();
      
      if (Array.isArray(parties)) {
        for (let i = 0; i < parties.length; i++) {
          const partyValue = navigate(data)
            .get("quote")
            .get("parties")
            .at(i)
            .get("owned")
            .get("totalValue")
            .or(0);
          
          totalValue += (partyValue);
        }
      }
      
      expect(totalValue).toBe(80000);
    });

    it("should handle malformed data gracefully", () => {
      const malformedData: any = {
        quote: {
          id: "Q123",
          parties: [
            {
              id: "P1",
              name: "John Doe",
              owned: null, // Missing owned data
            },
            null, // Null party
            {
              id: "P3",
              // Missing name and owned
            },
          ],
          premium: "invalid", // Wrong type
        },
        metadata: undefined,
      };
      
      // Should not throw errors
      const results = {
        quoteId: navigate(malformedData).get("quote").get("id").or("N/A"),
        firstPartyName: navigate(malformedData)
          .get("quote")
          .get("parties")
          .at(0)
          .get("name")
          .or("N/A"),
        firstPartyValue: navigate(malformedData)
          .get("quote")
          .get("parties")
          .at(0)
          .get("owned")
          .get("totalValue")
          .or(0),
        secondPartyName: navigate(malformedData)
          .get("quote")
          .get("parties")
          .at(1)
          .get("name")
          .or("N/A"),
        thirdPartyName: navigate(malformedData)
          .get("quote")
          .get("parties")
          .at(2)
          .get("name")
          .or("N/A"),
        premium: navigate(malformedData).get("quote").get("premium").or(0),
        version: navigate(malformedData).get("metadata").get("version").or(1),
      };
      
      expect(results.quoteId).toBe("Q123");
      expect(results.firstPartyName).toBe("John Doe");
      expect(results.firstPartyValue).toBe(0);
      expect(results.secondPartyName).toBe("N/A");
      expect(results.thirdPartyName).toBe("N/A");
      expect(results.premium).toBe("invalid");
      expect(results.version).toBe(1);
    });

    it("should work with shorthand syntax for simple paths", () => {
      const data = createComplexData();
      
      // Using optional chaining with $ for simple cases
      const make = $(data.quote?.parties?.[0]?.owned?.riskItems?.[0]?.make).or("Unknown");
      const invalidPath = $(data.quote?.parties?.[10]?.name).or("Not found");
      
      expect(make).toBe("Honda");
      expect(invalidPath).toBe("Not found");
    });
  });
});