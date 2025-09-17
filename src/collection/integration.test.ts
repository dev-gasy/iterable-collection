import { describe, it, expect } from "vitest";
import { from } from "../lens/lens.ts";
import { IterableCollection } from "./IterableCollection.ts";
import { Entity } from "./Entity.ts";
import type { BusinessEntity } from "./types.ts";

// Use case: Insurance Quote Management System
// Demonstrates integration of Entity, IterableCollection, and Fluent navigation

// Domain Data Types
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

  getRecentViolations(): ViolationEntity[] {
    const data = this.raw();
    if (!data?.violations) return [];

    return data.violations
      .map((v) => new ViolationEntity(v, data))
      .filter((v) => v.isRecent());
  }

  getTotalPoints(): number {
    return this.getRecentViolations().reduce(
      (total, violation) => total + violation.getPoints(),
      0
    );
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

  getVehicles(): VehicleEntity[] {
    const data = this.raw();
    return data?.vehicles?.map((v) => new VehicleEntity(v, data)) ?? [];
  }

  getDrivers(): DriverEntity[] {
    const data = this.raw();
    return data?.drivers?.map((d) => new DriverEntity(d, data)) ?? [];
  }

  getTotalVehicleValue(): number {
    return this.getVehicles().reduce(
      (total, vehicle) => total + vehicle.getValue(),
      0
    );
  }

  hasHighRiskDrivers(): boolean {
    return this.getDrivers().some((driver) => driver.isHighRisk());
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

  getParties(): PartyEntity[] {
    const data = this.raw();
    return data?.parties?.map((p) => new PartyEntity(p, data)) ?? [];
  }

  getCoverages(): CoverageEntity[] {
    const data = this.raw();
    return data?.coverages?.map((c) => new CoverageEntity(c, data)) ?? [];
  }

  getPrimaryParty(): PartyEntity | undefined {
    return this.getParties().find((party) => party.isPrimary());
  }

  getTotalVehicleValue(): number {
    return this.getParties().reduce(
      (total, party) => total + party.getTotalVehicleValue(),
      0
    );
  }

  isActive(): boolean {
    return this.getStatus() === "active";
  }

  hasHighRiskElements(): boolean {
    return this.getParties().some((party) => party.hasHighRiskDrivers());
  }
}

// Collection Classes
class VehicleCollection extends IterableCollection<
  VehicleData,
  VehicleEntity,
  PartyData
> {
  protected createEntity(data?: VehicleData): VehicleEntity {
    return new VehicleEntity(data, this.parent);
  }

  getClassicVehicles(): VehicleCollection {
    const classicVehicles = this.toArray().filter((vehicle) =>
      vehicle.isClassic()
    );
    const classicData = classicVehicles
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
    const highRiskDrivers = this.toArray().filter((driver) =>
      driver.isHighRisk()
    );
    const highRiskData = highRiskDrivers
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

class QuoteCollection extends IterableCollection<
  QuoteData,
  QuoteEntity,
  BusinessEntity
> {
  protected createEntity(data?: QuoteData): QuoteEntity {
    return new QuoteEntity(data, this.parent);
  }

  getActiveQuotes(): QuoteCollection {
    const activeQuotes = this.toArray().filter((quote) => quote.isActive());
    const activeData = activeQuotes
      .map((quote) => quote.raw())
      .filter((data): data is QuoteData => data != null);
    return new QuoteCollection(activeData);
  }

  getHighRiskQuotes(): QuoteCollection {
    const highRiskQuotes = this.toArray().filter((quote) =>
      quote.hasHighRiskElements()
    );
    const highRiskData = highRiskQuotes
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

// Test Data Factory
function createTestData() {
  const violationData: ViolationData[] = [
    {
      _key: { rootId: "violations", revisionNo: 1, id: "V1" },
      type: "speeding",
      date: "2023-06-15",
      points: 3,
    },
    {
      _key: { rootId: "violations", revisionNo: 1, id: "V2" },
      type: "reckless_driving",
      date: "2021-03-10",
      points: 6,
    },
  ];

  const vehicleData: VehicleData[] = [
    {
      _key: { rootId: "vehicles", revisionNo: 1, id: "V1" },
      vin: "1HGBH41JXMN109186",
      make: "Honda",
      model: "Civic",
      year: 2021,
      value: 25000,
    },
    {
      _key: { rootId: "vehicles", revisionNo: 1, id: "V2" },
      vin: "WBAVA37553NM36040",
      make: "BMW",
      model: "3 Series",
      year: 1995, // Classic car
      value: 15000,
    },
  ];

  const driverData: DriverData[] = [
    {
      _key: { rootId: "drivers", revisionNo: 1, id: "D1" },
      licenseNumber: "DL123456",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1985-03-15",
      violations: violationData,
    },
    {
      _key: { rootId: "drivers", revisionNo: 1, id: "D2" },
      licenseNumber: "DL789012",
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "2001-08-22", // Young driver
      violations: [],
    },
  ];

  const partyData: PartyData[] = [
    {
      _key: { rootId: "parties", revisionNo: 1, id: "P1" },
      name: "John Doe",
      type: "primary",
      vehicles: vehicleData,
      drivers: driverData,
    },
    {
      _key: { rootId: "parties", revisionNo: 1, id: "P2" },
      name: "Additional Party",
      type: "additional",
      vehicles: [],
      drivers: [],
    },
  ];

  const coverageData: CoverageData[] = [
    {
      _key: { rootId: "coverages", revisionNo: 1, id: "C1" },
      type: "liability",
      limit: 100000,
      deductible: 500,
      premium: 600,
    },
    {
      _key: { rootId: "coverages", revisionNo: 1, id: "C2" },
      type: "comprehensive",
      limit: 50000,
      deductible: 250,
      premium: 400,
    },
  ];

  const quoteData: QuoteData[] = [
    {
      _key: { rootId: "quotes", revisionNo: 1, id: "Q1" },
      quoteNumber: "QT-2024-001",
      status: "active",
      premium: 1200,
      effectiveDate: "2024-01-01",
      parties: partyData,
      coverages: coverageData,
    },
    {
      _key: { rootId: "quotes", revisionNo: 1, id: "Q2" },
      quoteNumber: "QT-2024-002",
      status: "draft",
      premium: 800,
      effectiveDate: "2024-02-01",
      parties: [partyData[1]], // Only additional party
      coverages: [coverageData[0]], // Only liability
    },
  ];

  return {
    quotes: quoteData,
    parties: partyData,
    vehicles: vehicleData,
    drivers: driverData,
    violations: violationData,
    coverages: coverageData,
  };
}

describe("Integration: Fluent + IterableCollection + Entity", () => {
  const testData = createTestData();

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
  });

  describe("Lens-based navigation with complex data", () => {
    it("should navigate through complex quote structure", () => {
      const quoteData = {
        portfolio: {
          quotes: testData.quotes,
          metadata: {
            created: "2024-01-01",
            version: 1,
          },
        },
      };

      // Navigate using improved type inference - much cleaner!
      const activeQuote = from(quoteData)
        .safeProp("portfolio")
        .safeProp("quotes")
        .findItem((quote: QuoteData) => quote.status === "active")
        .get();

      expect(activeQuote).toBeDefined();

      if (activeQuote) {
        const primaryParty = from(activeQuote)
          .safeProp("parties")
          .findItem((party: PartyData) => party.type === "primary")
          .get();

        expect(primaryParty).toBeDefined();

        if (primaryParty) {
          const firstVehicleVin = from(primaryParty)
            .safeProp("vehicles")
            .at<VehicleData>(0)
            .safeProp("vin")
            .getOr("Unknown VIN");

          expect(firstVehicleVin).toBe("1HGBH41JXMN109186");
        }
      }
    });

    it("should calculate risk scores using lens navigation", () => {
      const portfolioData = {
        quotes: testData.quotes,
        riskFactors: {
          youngDriverMultiplier: 1.5,
          classicCarMultiplier: 0.8,
          violationPointsCost: 50,
        },
      };

      // Calculate risk score using improved type inference
      const baseRisk = from(portfolioData)
        .safeProp("quotes")
        .at<QuoteData>(0)
        .safeProp("premium")
        .getOr(0);

      const drivers = from(portfolioData)
        .safeProp("quotes")
        .at<QuoteData>(0)
        .safeProp("parties")
        .findItem((party: PartyData) => party.type === "primary")
        .safeProp("drivers")
        .getOr([]);

      const hasYoungDrivers = drivers.some(
        (d: DriverData) => new DriverEntity(d).getAge() < 25
      );

      const violationCounts = drivers.map(
        (driver: DriverData) => driver.violations?.length ?? 0
      );
      const violationPoints = violationCounts.reduce(
        (sum: number, count: number) => sum + count,
        0
      );

      expect(typeof baseRisk).toBe("number");
      expect(baseRisk).toBe(1200);
      expect(hasYoungDrivers).toBe(true);
      expect(violationPoints).toBeGreaterThan(0);
    });

    it("should handle missing data gracefully with lens navigation", () => {
      const incompleteData = {
        quotes: [
          {
            _key: { rootId: "quotes", revisionNo: 1, id: "Q3" },
            quoteNumber: "QT-2024-003",
            status: "draft",
            premium: 0,
            effectiveDate: "2024-03-01",
            parties: null, // Missing parties
            coverages: [],
          },
        ],
      };

      // Should handle null parties gracefully using improved lens navigation
      const primaryPartyName = from(incompleteData)
        .safeProp("quotes")
        .at(0)
        .safeProp("parties")
        .findItem((party: any) => party?.type === "primary")
        .safeProp("name")
        .getOr("No Primary Party");

      const parties = from(incompleteData)
        .safeProp("quotes")
        .at(0)
        .safeProp("parties")
        .getOr([]);

      // Calculate total vehicles safely
      const totalVehicles = Array.isArray(parties)
        ? parties.reduce(
            (sum: number, party: any) => sum + (party?.vehicles?.length ?? 0),
            0
          )
        : 0;

      expect(primaryPartyName).toBe("No Primary Party");
      expect(totalVehicles).toBe(0);
    });

    it("should demonstrate optimized lens performance", () => {
      const quoteData = {
        portfolio: {
          quotes: testData.quotes,
          metadata: {
            created: "2024-01-01",
            version: 1,
          },
        },
      };

      // Direct fluent navigation - now optimized for performance
      const activeQuoteNumber = from(quoteData)
        .safeProp("portfolio")
        .safeProp("quotes")
        .findItem((quote: QuoteData) => quote.status === "active")
        .safeProp("quoteNumber")
        .getOr("No Quote Number");

      expect(activeQuoteNumber).toBe("QT-2024-001");

      // Fast transform with optimized implementation
      const quoteInfo = from(quoteData)
        .safeProp("portfolio")
        .safeProp("quotes")
        .at<QuoteData>(0)
        .transform((quote: QuoteData) => ({
          number: quote.quoteNumber,
          premium: quote.premium,
          partyCount: quote.parties?.length ?? 0,
        }))
        .getOr({ number: "Unknown", premium: 0, partyCount: 0 });

      expect(quoteInfo.number).toBe("QT-2024-001");
      expect(quoteInfo.premium).toBe(1200);
      expect(quoteInfo.partyCount).toBe(2);

      // Demonstrate high-performance array operations
      const highValueVehicle = from(quoteData)
        .safeProp("portfolio")
        .safeProp("quotes")
        .at<QuoteData>(0)
        .safeProp("parties")
        .findItem((party: PartyData) => party.type === "primary")
        .safeProp("vehicles")
        .findItem((vehicle: VehicleData) => vehicle.value > 20000)
        .safeProp("vin")
        .getOr("No high-value vehicle");

      expect(highValueVehicle).toBe("1HGBH41JXMN109186");
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle index bounds safely", () => {
      const quotes = new QuoteCollection(testData.quotes);

      const outOfBounds = quotes.at(999);
      expect(outOfBounds).toBeDefined();
      expect(outOfBounds.raw()).toBeUndefined();

      const negative = quotes.at(-1);
      expect(negative).toBeDefined();
      expect(negative.raw()).toBeUndefined();
    });

    it("should preserve immutability", () => {
      const quotes = new QuoteCollection(testData.quotes);
      const originalLength = quotes.length;

      const newQuotes = quotes.push({
        _key: { rootId: "quotes", revisionNo: 1, id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "draft",
        premium: 500,
        effectiveDate: "2024-03-01",
        parties: [],
        coverages: [],
      });

      expect(quotes.length).toBe(originalLength);
      expect(newQuotes.length).toBe(originalLength + 1);
      expect(quotes).not.toBe(newQuotes);
    });

    it("should handle null/undefined data in entities", () => {
      const invalidQuoteData = {
        _key: { rootId: "quotes", revisionNo: 1, id: "Q4" },
        quoteNumber: null as any,
        status: undefined as any,
        premium: NaN,
        effectiveDate: "",
        parties: null as any,
        coverages: undefined as any,
      };

      const quote = new QuoteEntity(invalidQuoteData);

      expect(quote.getQuoteNumber()).toBe("Unknown");
      expect(quote.getStatus()).toBe("draft");
      expect(quote.getPremium()).toBe(0);
      expect(quote.getParties()).toEqual([]);
      expect(quote.getCoverages()).toEqual([]);
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

      expect(cached).toBeLessThan(uncached * 2);
    });
  });

  describe("Combined usage patterns", () => {
    it("should demonstrate end-to-end workflow", () => {
      // Start with raw data and build collections
      const quotes = new QuoteCollection(testData.quotes);

      // Use collections to filter and process
      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      // Get entities from collections
      const firstQuote = activeQuotes.at(0);
      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      // Use entities to access nested collections
      const vehicles = primaryParty?.getVehicles();
      const drivers = primaryParty?.getDrivers();

      // Use improved lens navigation on entity data
      const quoteRaw = firstQuote.raw();

      const firstDriverViolations = quoteRaw
        ? from(quoteRaw)
            .safeProp("parties")
            .findItem((party: PartyData) => party.type === "primary")
            .safeProp("drivers")
            .at<DriverData>(0)
            .safeProp("violations")
            .getOr([])
        : [];

      expect(vehicles?.length).toBe(2);
      expect(drivers?.length).toBe(2);
      expect(firstDriverViolations.length).toBe(2);

      // Combine everything for business logic
      const riskAssessment = {
        hasClassicVehicles: vehicles?.some((v) => v.isClassic()),
        hasHighRiskDrivers: drivers?.some((d) => d.isHighRisk()),
        totalVehicleValue: vehicles?.reduce((sum, v) => sum + v.getValue(), 0),
        totalPoints: drivers?.reduce((sum, d) => sum + d.getTotalPoints(), 0),
      };

      expect(riskAssessment.hasClassicVehicles).toBe(true);
      expect(riskAssessment.hasHighRiskDrivers).toBe(true);
      expect(riskAssessment.totalVehicleValue).toBe(40000);
      expect(riskAssessment.totalPoints).toBe(3);
    });

    it("should handle data transformation pipeline", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Transform quotes to summary objects using all three patterns
      const quoteSummaries = quotes
        .toArray()
        .map((quote) => {
          const raw = quote.raw();
          if (!raw) return null;

          // Use improved lens navigation for complex data extraction
          const parties = from(raw)
            .safeProp("parties")
            .getOr([]) as PartyData[];

          const vehicleCount = parties.reduce(
            (sum: number, party: PartyData) =>
              sum + (party?.vehicles?.length ?? 0),
            0
          );
          const driverCount = parties.reduce(
            (sum: number, party: PartyData) =>
              sum + (party?.drivers?.length ?? 0),
            0
          );

          // Use entity methods for business logic
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
});
