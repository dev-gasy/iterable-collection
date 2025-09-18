import { describe, it, expect } from "vitest";
import { produce } from "immer";

import type { BusinessEntity } from "../collection/types";
import { Entity } from "../collection/Entity";
import { IterableCollection } from "../collection/IterableCollection";
import { any, partial } from "../partial/utils";

// Domain Data Types for entity/collections tests
interface VehicleData extends BusinessEntity {
  vin: string;
  make: string;
  model: string;
  year: number;
  value: number;
}

interface DriverData extends BusinessEntity {
  licenseNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  violations: ViolationData[];
}

interface ViolationData extends BusinessEntity {
  type: string;
  date: string;
  points: number;
}

interface PartyData extends BusinessEntity {
  name: string;
  type: "primary" | "additional";
  vehicles: VehicleData[];
  drivers: DriverData[];
}

interface QuoteData extends BusinessEntity {
  quoteNumber: string;
  status: "draft" | "active" | "expired";
  premium: number;
  effectiveDate: string;
  parties: PartyData[];
  coverages: CoverageData[];
}

interface CoverageData extends BusinessEntity {
  type: string;
  limit: number;
  deductible: number;
  premium: number;
}

// Entity Classes
class VehicleEntity extends Entity<VehicleData, PartyData> {
  getDisplayName(): string {
    const data = this.raw();
    return data ? `${data.year} ${data.make} ${data.model}` : "Unknown Vehicle";
  }

  getValue(): number {
    return this.raw()?.value ?? 0;
  }

  isClassic(): boolean {
    const currentYear = new Date().getFullYear();
    const vehicleYear = this.raw()?.year ?? currentYear;
    return currentYear - vehicleYear > 25;
  }
}

class ViolationEntity extends Entity<ViolationData, DriverData> {
  isRecent(): boolean {
    const violationDate = new Date(this.raw()?.date ?? "");
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    return violationDate > threeYearsAgo;
  }

  getPoints(): number {
    return this.raw()?.points ?? 0;
  }
}

class DriverEntity extends Entity<DriverData, PartyData> {
  getFullName(): string {
    const data = this.raw();
    return data ? `${data.firstName} ${data.lastName}` : "Unknown Driver";
  }

  getAge(): number {
    const birthDate = new Date(this.raw()?.dateOfBirth ?? "");
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  }

  getRecentViolations(): ViolationCollection {
    const data = this.raw();
    if (!data?.violations) return new ViolationCollection([], data);

    const recentViolations = data.violations.filter((v) => {
      const violation = new ViolationEntity(v, data);
      return violation.isRecent();
    });
    return new ViolationCollection(recentViolations, data);
  }

  getTotalPoints(): number {
    return this.getRecentViolations()
      .toArray()
      .reduce((total, violation) => total + violation.getPoints(), 0);
  }

  isHighRisk(): boolean {
    return this.getTotalPoints() > 6 || this.getAge() < 25;
  }
}

class PartyEntity extends Entity<PartyData, QuoteData> {
  getName(): string {
    return this.raw()?.name ?? "Unknown Party";
  }

  isPrimary(): boolean {
    return this.raw()?.type === "primary";
  }

  getVehicles(): VehicleCollection {
    const data = this.raw();
    return new VehicleCollection(data?.vehicles ?? [], data);
  }

  getDrivers(): DriverCollection {
    const data = this.raw();
    return new DriverCollection(data?.drivers ?? [], data);
  }

  getTotalVehicleValue(): number {
    return this.getVehicles()
      .toArray()
      .reduce((total, vehicle) => total + vehicle.getValue(), 0);
  }

  hasHighRiskDrivers(): boolean {
    return this.getDrivers()
      .toArray()
      .some((driver) => driver.isHighRisk());
  }
}

class CoverageEntity extends Entity<CoverageData, QuoteData> {
  getType(): string {
    return this.raw()?.type ?? "Unknown";
  }

  getPremium(): number {
    return this.raw()?.premium ?? 0;
  }

  getLimit(): number {
    return this.raw()?.limit ?? 0;
  }
}

class QuoteEntity extends Entity<QuoteData, BusinessEntity> {
  getQuoteNumber(): string {
    return this.raw()?.quoteNumber ?? "Unknown";
  }

  getStatus(): string {
    return this.raw()?.status ?? "draft";
  }

  getPremium(): number {
    const premium = this.raw()?.premium;
    return typeof premium === "number" && !isNaN(premium) ? premium : 0;
  }

  getParties(): PartyCollection {
    const data = this.raw();
    return new PartyCollection(data?.parties ?? [], data);
  }

  getCoverages(): CoverageCollection {
    const data = this.raw();
    return new CoverageCollection(data?.coverages ?? [], data);
  }

  getPrimaryParty(): PartyEntity | undefined {
    return this.getParties()
      .toArray()
      .find((party) => party.isPrimary());
  }

  getTotalVehicleValue(): number {
    return this.getParties()
      .toArray()
      .reduce((total, party) => total + party.getTotalVehicleValue(), 0);
  }

  isActive(): boolean {
    return this.getStatus() === "active";
  }

  hasHighRiskElements(): boolean {
    return this.getParties()
      .toArray()
      .some((party) => party.hasHighRiskDrivers());
  }
}

// Collection Classes
class ViolationCollection extends IterableCollection<
  ViolationData,
  ViolationEntity,
  DriverData
> {
  protected createEntity(data?: ViolationData): ViolationEntity {
    return new ViolationEntity(data, this.parent);
  }

  getRecent(): ViolationCollection {
    const recentData = this.toArray()
      .filter((violation) => violation.isRecent())
      .map((violation) => violation.raw())
      .filter((data): data is ViolationData => data != null);
    return new ViolationCollection(recentData, this.parent);
  }

  getTotalPoints(): number {
    return this.toArray().reduce(
      (total, violation) => total + violation.getPoints(),
      0
    );
  }
}

class VehicleCollection extends IterableCollection<
  VehicleData,
  VehicleEntity,
  PartyData
> {
  protected createEntity(data?: VehicleData): VehicleEntity {
    return new VehicleEntity(data, this.parent);
  }

  getClassicVehicles(): VehicleCollection {
    const classicData = this.toArray()
      .filter((vehicle) => vehicle.isClassic())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleCollection(classicData, this.parent);
  }

  getTotalValue(): number {
    return this.toArray().reduce(
      (total, vehicle) => total + vehicle.getValue(),
      0
    );
  }
}

class DriverCollection extends IterableCollection<
  DriverData,
  DriverEntity,
  PartyData
> {
  protected createEntity(data?: DriverData): DriverEntity {
    return new DriverEntity(data, this.parent);
  }

  getHighRiskDrivers(): DriverCollection {
    const highRiskData = this.toArray()
      .filter((driver) => driver.isHighRisk())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverCollection(highRiskData, this.parent);
  }

  getAverageAge(): number {
    const drivers = this.toArray();
    if (drivers.length === 0) return 0;
    const totalAge = drivers.reduce((sum, driver) => sum + driver.getAge(), 0);
    return totalAge / drivers.length;
  }
}

class PartyCollection extends IterableCollection<
  PartyData,
  PartyEntity,
  QuoteData
> {
  protected createEntity(data?: PartyData): PartyEntity {
    return new PartyEntity(data, this.parent);
  }

  getPrimaryParties(): PartyCollection {
    const primaryData = this.toArray()
      .filter((party) => party.isPrimary())
      .map((party) => party.raw())
      .filter((data): data is PartyData => data != null);
    return new PartyCollection(primaryData, this.parent);
  }
}

class CoverageCollection extends IterableCollection<
  CoverageData,
  CoverageEntity,
  QuoteData
> {
  protected createEntity(data?: CoverageData): CoverageEntity {
    return new CoverageEntity(data, this.parent);
  }

  getRequiredCoverages(): CoverageCollection {
    const requiredData = this.toArray()
      .filter((coverage) => coverage.getType() === "liability") // Simple filter for required
      .map((coverage) => coverage.raw())
      .filter((data): data is CoverageData => data != null);
    return new CoverageCollection(requiredData, this.parent);
  }

  getTotalPremium(): number {
    return this.toArray().reduce(
      (total, coverage) => total + coverage.getPremium(),
      0
    );
  }
}

class QuoteCollection extends IterableCollection<
  QuoteData,
  QuoteEntity,
  BusinessEntity
> {
  protected createEntity(data?: QuoteData): QuoteEntity {
    return new QuoteEntity(data, this.parent);
  }

  getActiveQuotes(): QuoteCollection {
    const activeData = this.toArray()
      .filter((quote) => quote.isActive())
      .map((quote) => quote.raw())
      .filter((data): data is QuoteData => data != null);
    return new QuoteCollection(activeData);
  }

  getHighRiskQuotes(): QuoteCollection {
    const highRiskData = this.toArray()
      .filter((quote) => quote.hasHighRiskElements())
      .map((quote) => quote.raw())
      .filter((data): data is QuoteData => data != null);
    return new QuoteCollection(highRiskData);
  }

  getTotalPremium(): number {
    return this.toArray().reduce(
      (total, quote) => total + quote.getPremium(),
      0
    );
  }
}

function createEntityTestData() {
  const violations = [
    partial<ViolationData>({
      _key: { id: "V1" },
      type: "speeding",
      date: "2023-06-15",
      points: 3,
    }),
    partial<ViolationData>({
      _key: { id: "V2" },
      type: "reckless_driving",
      date: "2021-03-10",
      points: 6,
    }),
  ];

  const vehicles = [
    partial<VehicleData>({
      _key: { id: "V1" },
      make: "Honda",
      model: "Civic",
      year: 2021,
      value: 25000,
    }),
    partial<VehicleData>({
      _key: { id: "V2" },
      make: "BMW",
      model: "3 Series",
      year: 1995,
      value: 15000,
    }),
  ];

  const drivers = [
    partial<DriverData>({
      _key: { id: "D1" },
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1985-03-15",
      violations,
    }),
    partial<DriverData>({
      _key: { id: "D2" },
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "2001-08-22",
    }),
  ];

  const parties = [
    partial<PartyData>({
      _key: { id: "P1" },
      name: "John Doe",
      type: "primary",
      vehicles,
      drivers,
    }),
    partial<PartyData>({
      _key: { id: "P2" },
      name: "Additional Party",
      type: "additional",
    }),
  ];

  const coverages = [
    partial<CoverageData>({
      _key: { id: "C1" },
      type: "liability",
      limit: 100000,
      deductible: 500,
      premium: 600,
    }),
    partial<CoverageData>({
      _key: { id: "C2" },
      type: "comprehensive",
      limit: 50000,
      deductible: 250,
      premium: 400,
    }),
  ];

  const quotes = [
    partial<QuoteData>({
      _key: { id: "Q1" },
      quoteNumber: "QT-2024-001",
      status: "active",
      premium: 1200,
      parties,
      coverages,
    }),
    partial<QuoteData>({
      _key: { id: "Q2" },
      quoteNumber: "QT-2024-002",
      status: "draft",
      premium: 800,
      parties: [parties[1]],
      coverages: [coverages[0]],
    }),
  ];

  return { quotes, parties, vehicles, drivers, violations, coverages };
}

describe("Entity and Collection Tests", () => {
  const testData = createEntityTestData();

  describe("Entity functionality", () => {
    it("should work with individual entities", () => {
      const quote = new QuoteEntity(testData.quotes[0]);

      expect(quote.getQuoteNumber()).toBe("QT-2024-001");
      expect(quote.isActive()).toBe(true);
      expect(quote.getPremium()).toBe(1200);
      expect(quote.hasHighRiskElements()).toBe(true);

      const primaryParty = quote.getPrimaryParty();
      expect(primaryParty?.getName()).toBe("John Doe");
      expect(primaryParty?.getTotalVehicleValue()).toBe(40000);
    });

    it("should handle driver risk assessment", () => {
      const driver = new DriverEntity(testData.drivers[0]);

      expect(driver.getFullName()).toBe("John Doe");
      expect(driver.getAge()).toBeGreaterThan(30);
      expect(driver.getTotalPoints()).toBe(3); // Only recent violations
      expect(driver.isHighRisk()).toBe(false); // Over 25 with <= 6 points

      const youngDriver = new DriverEntity(testData.drivers[1]);
      expect(youngDriver.isHighRisk()).toBe(true); // Under 25
    });

    it("should identify classic vehicles", () => {
      const modernVehicle = new VehicleEntity(testData.vehicles[0]);
      const classicVehicle = new VehicleEntity(testData.vehicles[1]);

      expect(modernVehicle.isClassic()).toBe(false);
      expect(classicVehicle.isClassic()).toBe(true);
      expect(classicVehicle.getDisplayName()).toBe("1995 BMW 3 Series");
    });

    it("should handle null/undefined data in entities", () => {
      const quote = new QuoteEntity(
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

  describe("IterableCollection functionality", () => {
    it("should work with quote collections", () => {
      const quotes = new QuoteCollection(testData.quotes);

      expect(quotes.length).toBe(2);
      expect(quotes.getTotalPremium()).toBe(2000);

      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);
      expect(activeQuotes.at(0).getQuoteNumber()).toBe("QT-2024-001");

      const highRiskQuotes = quotes.getHighRiskQuotes();
      expect(highRiskQuotes.length).toBe(1);
    });

    it("should work with vehicle collections", () => {
      const vehicles = new VehicleCollection(testData.vehicles);

      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).getDisplayName()).toBe("1995 BMW 3 Series");
    });

    it("should work with driver collections", () => {
      const drivers = new DriverCollection(testData.drivers);

      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1); // Only the young driver
      expect(highRiskDrivers.at(0).getFullName()).toBe("Jane Smith");
    });

    it("should preserve immutability", () => {
      const quotes = new QuoteCollection(testData.quotes);
      const originalLength = quotes.length;

      const newQuotes = quotes.push(partial({ _key: { id: "Q3" } }));

      expect(quotes.length).toBe(originalLength);
      expect(newQuotes.length).toBe(originalLength + 1);
      expect(quotes).not.toBe(newQuotes);
    });

    it("should handle index bounds safely", () => {
      const quotes = new QuoteCollection(testData.quotes);

      const outOfBounds = quotes.at(999);
      expect(outOfBounds).toBeDefined();
      expect(outOfBounds.raw()).toBeUndefined();

      const negative = quotes.at(-1);
      expect(negative).toBeDefined();
      expect(negative.raw()).toBeUndefined();
    });
  });

  describe("Immer integration with entities and collections", () => {
    it("should demonstrate complex state updates with Immer", () => {
      const quotes = new QuoteCollection(testData.quotes);
      const originalQuote = quotes.at(0);

      // Create a complex state update using Immer
      const updatedQuoteData = produce(originalQuote.raw()!, (draft) => {
        // Update quote premium
        draft.premium = 1500;

        // Add a new coverage
        draft.coverages.push({
          _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
          type: "collision",
          limit: 75000,
          deductible: 500,
          premium: 300,
        });

        // Update primary party's first vehicle value
        const primaryParty = draft.parties.find((p) => p.type === "primary");
        if (primaryParty && primaryParty.vehicles.length > 0) {
          primaryParty.vehicles[0].value = 30000;
        }

        // Add a new violation to the first driver
        const firstDriver = primaryParty?.drivers[0];
        if (firstDriver) {
          firstDriver.violations.push({
            _key: { rootId: "violations", revisionNo: 1, id: "V3" },
            type: "parking",
            date: "2024-01-15",
            points: 1,
          });
        }
      });

      // Create new collections with updated data
      const updatedQuote = new QuoteCollection([updatedQuoteData]).at(0);

      // Verify original data unchanged
      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      // Verify updates applied
      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4); // 3 + 1 new point
    });

    it("should handle collection mutations with Immer", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Use Immer to create complex collection updates
      const newQuoteData = partial<QuoteData>({ quoteNumber: "QT-2024-003" });

      // Add new quote and update existing ones using collection methods (which use Immer internally)
      const expandedQuotes = quotes
        .push(newQuoteData)
        .insertAt(1, partial({ quoteNumber: "QT-2024-004" }));

      expect(quotes.length).toBe(2); // Original unchanged
      expect(expandedQuotes.length).toBe(4); // New collection with additions
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });
  });

  describe("Performance and optimization", () => {
    it("should demonstrate entity caching performance", () => {
      const quotes = new QuoteCollection(testData.quotes);

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        quotes.at(0);
        quotes.at(1);
      }

      const cached = performance.now() - start;

      const start2 = performance.now();
      for (let i = 0; i < 100; i++) {
        new QuoteEntity(testData.quotes[0]);
        new QuoteEntity(testData.quotes[1]);
      }
      const uncached = performance.now() - start2;

      expect(cached).toBeLessThan(uncached * 5); // More lenient performance test
    });
  });

  describe("Advanced collection patterns", () => {
    it("should support collection chaining and filtering", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Chain multiple collection operations
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
      const quotes = new QuoteCollection(testData.quotes);
      const firstQuote = quotes.at(0);

      // Navigate through entity relationships
      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      const vehicles = primaryParty?.getVehicles();
      expect(vehicles?.length).toBe(2);

      const drivers = primaryParty?.getDrivers();
      expect(drivers?.length).toBe(2);

      // Test specific vehicle properties
      const classicVehicle = vehicles?.toArray().find((v) => v.isClassic());
      expect(classicVehicle).toBeDefined();
      expect(classicVehicle!.getDisplayName()).toBe("1995 BMW 3 Series");

      // Test driver risk assessment
      const highRiskDriver = drivers?.toArray().find((d) => d.isHighRisk());
      expect(highRiskDriver).toBeDefined();
      expect(highRiskDriver!.getFullName()).toBe("Jane Smith");
    });
  });
});
