import { describe, it, expect } from "vitest";
import { produce } from "immer";

import { IterableCollection } from "../collection/IterableCollection.ts";
import { Entity } from "../collection/Entity.ts";
import type { BusinessEntity } from "../collection/types.ts";

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

describe("Core Integration: Entity + Collection + Immer", () => {
  const testData = createTestData();

  describe("Core integration patterns", () => {
    it("should integrate entities and collections", () => {
      // Start with collections
      const quotes = new QuoteCollection(testData.quotes);

      // Use collections to get entities
      const activeQuotes = quotes.getActiveQuotes();
      const firstQuote = activeQuotes.at(0);

      // Use entities to access business logic
      expect(firstQuote.getQuoteNumber()).toBe("QT-2024-001");
      expect(firstQuote.isActive()).toBe(true);

      // Use entity methods to navigate relationships
      const primaryPartyName =
        firstQuote.getPrimaryParty()?.getName() || "Unknown";

      expect(primaryPartyName).toBe("John Doe");

      // Combine collections and entity methods
      const riskAnalysis = activeQuotes.toArray().map((quote) => {
        const primaryParty = quote.getPrimaryParty();
        const vehicles = primaryParty?.getVehicles() || [];

        // Use entity methods for business logic
        const hasHighRisk = quote.hasHighRiskElements();
        const totalValue = quote.getTotalVehicleValue();

        return {
          quoteNumber: quote.getQuoteNumber(),
          vehicleCount: vehicles.length,
          totalValue,
          hasHighRisk,
        };
      });

      expect(riskAnalysis[0]).toEqual({
        quoteNumber: "QT-2024-001",
        vehicleCount: 2,
        totalValue: 40000,
        hasHighRisk: true,
      });
    });

    it("should handle complex data transformations using entity methods", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Transform quotes to summary objects using entity methods
      const quoteSummaries = quotes
        .toArray()
        .map((quote) => {
          const raw = quote.raw();
          if (!raw) return null;

          // Use entity methods for data extraction
          const parties = quote.getParties();
          const vehicleCount = parties.reduce(
            (sum, party) => sum + party.getVehicles().length,
            0
          );
          const driverCount = parties.reduce(
            (sum, party) => sum + party.getDrivers().length,
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

  describe("Immer integration", () => {
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
      const updatedQuotes = new QuoteCollection([updatedQuoteData]);
      const updatedQuote = updatedQuotes.at(0);

      // Verify original data unchanged
      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      // Verify updates applied
      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages()[2].getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles()[0].getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers()[0].getTotalPoints()).toBe(4); // 3 + 1 new point
    });

    it("should handle collection mutations with Immer", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Use Immer to create complex collection updates
      const newQuoteData: QuoteData = {
        _key: { rootId: "quotes", revisionNo: 1, id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
        effectiveDate: "2024-03-01",
        parties: [],
        coverages: [],
      };

      // Add new quote and update existing ones using collection methods (which use Immer internally)
      const expandedQuotes = quotes.push(newQuoteData).insertAt(1, {
        _key: { rootId: "quotes", revisionNo: 1, id: "Q4" },
        quoteNumber: "QT-2024-004",
        status: "draft",
        premium: 750,
        effectiveDate: "2024-04-01",
        parties: [],
        coverages: [],
      });

      expect(quotes.length).toBe(2); // Original unchanged
      expect(expandedQuotes.length).toBe(4); // New collection with additions
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });

    it("should combine Immer with entity methods for complex updates", () => {
      const portfolioData = {
        quotes: testData.quotes,
        metadata: { version: 1, lastUpdated: "2024-01-01" },
      };

      // Use Immer to update nested portfolio data
      const updatedPortfolio = produce(portfolioData, (draft) => {
        // Update metadata
        draft.metadata.version = 2;
        draft.metadata.lastUpdated = "2024-01-15";

        // Find and update specific quote
        const activeQuote = draft.quotes.find((q) => q.status === "active");
        if (activeQuote) {
          activeQuote.premium = 1350;

          // Add new party to the active quote
          activeQuote.parties.push({
            _key: { rootId: "parties", revisionNo: 1, id: "P3" },
            name: "Secondary Driver",
            type: "additional",
            vehicles: [],
            drivers: [
              {
                _key: { rootId: "drivers", revisionNo: 1, id: "D3" },
                licenseNumber: "DL345678",
                firstName: "Bob",
                lastName: "Wilson",
                dateOfBirth: "1980-05-10",
                violations: [],
              },
            ],
          });
        }
      });

      // Verify original unchanged
      expect(portfolioData.metadata.version).toBe(1);
      expect(portfolioData.quotes[0].premium).toBe(1200);
      expect(portfolioData.quotes[0].parties.length).toBe(2);

      // Verify updates
      expect(updatedPortfolio.metadata.version).toBe(2);
      expect(updatedPortfolio.quotes[0].premium).toBe(1350);
      expect(updatedPortfolio.quotes[0].parties.length).toBe(3);

      // Use entity methods to verify the new party
      const updatedQuotes = new QuoteCollection(updatedPortfolio.quotes);
      const updatedQuote = updatedQuotes.at(0);
      const newPartyName =
        updatedQuote.getParties()[2]?.getName() || "Not found";

      expect(newPartyName).toBe("Secondary Driver");
    });
  });

  describe("Combined usage patterns", () => {
    it("should demonstrate end-to-end workflow with entities and collections", () => {
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

      // Use entity methods to access nested data
      const firstDriverViolations = drivers?.[0]?.getRecentViolations();

      expect(vehicles?.length).toBe(2);
      expect(drivers?.length).toBe(2);
      expect(firstDriverViolations?.length).toBe(1); // Only recent violations

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
  });
});
