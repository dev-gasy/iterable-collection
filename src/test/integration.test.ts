import { describe, it, expect } from "vitest";
import { produce } from "immer";

import { IterableCollection } from "../collection/IterableCollection.ts";
import { Entity } from "../collection/Entity.ts";
import type { BusinessEntity } from "../collection/types.ts";
import { partial } from "../partial/utils";

// Domain Data Types with optional attributes
interface VehicleData extends BusinessEntity {
  make: string;
  model: string;
  year: number;
  value: number;
  vin?: string;
  color?: string;
  mileage?: number;
  fuelType?: "gas" | "diesel" | "electric" | "hybrid";
}

interface DriverData extends BusinessEntity {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber?: string;
  licenseState?: string;
  violations?: ViolationData[];
  experience?: number; // years of driving
  education?: "high_school" | "college" | "graduate";
}

interface ViolationData extends BusinessEntity {
  type: string;
  date: string;
  points: number;
  fine?: number;
  description?: string;
  location?: string;
}

interface PartyData extends BusinessEntity {
  name: string;
  type: "primary" | "additional";
  vehicles?: VehicleData[];
  drivers?: DriverData[];
  address?: string;
  phone?: string;
  email?: string;
}

interface QuoteData extends BusinessEntity {
  quoteNumber: string;
  status: "draft" | "active" | "expired";
  premium: number;
  parties?: PartyData[];
  coverages?: CoverageData[];
  effectiveDate?: string;
  expirationDate?: string;
  agent?: string;
  discounts?: number;
}

interface CoverageData extends BusinessEntity {
  type: string;
  limit: number;
  deductible: number;
  premium: number;
  description?: string;
  isRequired?: boolean;
}

// Entity Classes
class VehicleEntity extends Entity<VehicleData, PartyData> {
  getDisplayName(): string {
    const data = this.raw();
    if (!data) return "Unknown Vehicle";
    const color = data.color ? ` ${data.color}` : "";
    return `${data.year}${color} ${data.make} ${data.model}`;
  }

  getValue(): number {
    return this.raw()?.value ?? 0;
  }

  isClassic(): boolean {
    const currentYear = new Date().getFullYear();
    const vehicleYear = this.raw()?.year ?? currentYear;
    return currentYear - vehicleYear > 25;
  }

  isEcoFriendly(): boolean {
    const fuelType = this.raw()?.fuelType;
    return fuelType === "electric" || fuelType === "hybrid";
  }

  isHighMileage(): boolean {
    const mileage = this.raw()?.mileage ?? 0;
    return mileage > 100000;
  }

  getVin(): string | undefined {
    return this.raw()?.vin;
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

  isMajor(): boolean {
    return this.getPoints() >= 4;
  }

  getFine(): number {
    return this.raw()?.fine ?? 0;
  }

  getDescription(): string {
    return this.raw()?.description ?? this.raw()?.type ?? "Unknown Violation";
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

  getViolations(): ViolationCollection {
    const data = this.raw();
    return new ViolationCollection(data?.violations ?? [], data);
  }

  getRecentViolations(): ViolationCollection {
    return this.getViolations().getRecent();
  }

  getTotalPoints(): number {
    return this.getRecentViolations().getTotalPoints();
  }

  isHighRisk(): boolean {
    return this.getTotalPoints() > 6 || this.getAge() < 25;
  }

  isExperienced(): boolean {
    const experience = this.raw()?.experience ?? 0;
    return experience >= 10;
  }

  hasEducation(): boolean {
    return !!this.raw()?.education;
  }

  getLicenseNumber(): string | undefined {
    return this.raw()?.licenseNumber;
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
    return this.getVehicles().getTotalValue();
  }

  hasHighRiskDrivers(): boolean {
    return this.getDrivers().getHighRiskDrivers().length > 0;
  }

  getAddress(): string | undefined {
    return this.raw()?.address;
  }

  getContactInfo(): { phone?: string; email?: string } {
    const data = this.raw();
    return {
      phone: data?.phone,
      email: data?.email,
    };
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

  getDeductible(): number {
    return this.raw()?.deductible ?? 0;
  }

  isRequired(): boolean {
    return this.raw()?.isRequired ?? false;
  }

  getDescription(): string {
    return this.raw()?.description ?? this.getType();
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

  getAgent(): string | undefined {
    return this.raw()?.agent;
  }

  getDiscounts(): number {
    return this.raw()?.discounts ?? 0;
  }

  getEffectiveDate(): string | undefined {
    return this.raw()?.effectiveDate;
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

  getEcoFriendlyVehicles(): VehicleCollection {
    const ecoData = this.toArray()
      .filter((vehicle) => vehicle.isEcoFriendly())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleCollection(ecoData, this.parent);
  }

  getHighMileageVehicles(): VehicleCollection {
    const highMileageData = this.toArray()
      .filter((vehicle) => vehicle.isHighMileage())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleCollection(highMileageData, this.parent);
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

  getExperiencedDrivers(): DriverCollection {
    const experiencedData = this.toArray()
      .filter((driver) => driver.isExperienced())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverCollection(experiencedData, this.parent);
  }

  getEducatedDrivers(): DriverCollection {
    const educatedData = this.toArray()
      .filter((driver) => driver.hasEducation())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverCollection(educatedData, this.parent);
  }
}

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

  getMajorViolations(): ViolationCollection {
    const majorData = this.toArray()
      .filter((violation) => violation.isMajor())
      .map((violation) => violation.raw())
      .filter((data): data is ViolationData => data != null);
    return new ViolationCollection(majorData, this.parent);
  }

  getTotalPoints(): number {
    return this.toArray().reduce(
      (total, violation) => total + violation.getPoints(),
      0
    );
  }

  getTotalFines(): number {
    return this.toArray().reduce(
      (total, violation) => total + violation.getFine(),
      0
    );
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
      .filter((coverage) => coverage.isRequired())
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

  getCoverageByType(type: string): CoverageEntity | undefined {
    return this.toArray().find((coverage) => coverage.getType() === type);
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

  getPartiesWithHighRisk(): PartyCollection {
    const highRiskData = this.toArray()
      .filter((party) => party.hasHighRiskDrivers())
      .map((party) => party.raw())
      .filter((data): data is PartyData => data != null);
    return new PartyCollection(highRiskData, this.parent);
  }

  getTotalVehicleValue(): number {
    return this.toArray().reduce(
      (total, party) => total + party.getTotalVehicleValue(),
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

function createTestData() {
  const violations = [
    partial<ViolationData>({
      _key: { id: "V1" },
      type: "speeding",
      date: "2023-06-15",
      points: 3,
      fine: 150,
      description: "Going 20mph over speed limit",
      location: "Highway 101",
    }),
    partial<ViolationData>({
      _key: { id: "V2" },
      type: "reckless_driving",
      date: "2021-03-10",
      points: 6,
      fine: 500,
      description: "Dangerous lane changing",
    }),
  ];

  const vehicles = [
    partial<VehicleData>({
      _key: { id: "V1" },
      make: "Honda",
      model: "Civic",
      year: 2021,
      value: 25000,
      vin: "1HGBH41JXMN109186",
      color: "Blue",
      mileage: 45000,
      fuelType: "hybrid",
    }),
    partial<VehicleData>({
      _key: { id: "V2" },
      make: "BMW",
      model: "3 Series",
      year: 1995,
      value: 15000,
      vin: "WBAVA37553NM36040",
      color: "Black",
      mileage: 150000,
      fuelType: "gas",
    }),
  ];

  const drivers = [
    partial<DriverData>({
      _key: { id: "D1" },
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1985-03-15",
      licenseNumber: "DL123456789",
      licenseState: "CA",
      violations,
      experience: 15,
      education: "college",
    }),
    partial<DriverData>({
      _key: { id: "D2" },
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "2001-08-22",
      licenseNumber: "DL987654321",
      licenseState: "CA",
      experience: 3,
      education: "high_school",
    }),
  ];

  const parties = [
    partial<PartyData>({
      _key: { id: "P1" },
      name: "John Doe",
      type: "primary",
      vehicles,
      drivers,
      address: "123 Main St, San Francisco, CA 94102",
      phone: "(555) 123-4567",
      email: "john.doe@email.com",
    }),
    partial<PartyData>({
      _key: { id: "P2" },
      name: "Additional Party",
      type: "additional",
      address: "456 Oak Ave, San Francisco, CA 94103",
      phone: "(555) 987-6543",
    }),
  ];

  const coverages = [
    partial<CoverageData>({
      _key: { id: "C1" },
      type: "liability",
      limit: 100000,
      deductible: 500,
      premium: 600,
      description: "Bodily injury and property damage liability",
      isRequired: true,
    }),
    partial<CoverageData>({
      _key: { id: "C2" },
      type: "comprehensive",
      limit: 50000,
      deductible: 250,
      premium: 400,
      description: "Coverage for theft, vandalism, and natural disasters",
      isRequired: false,
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
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
      agent: "Alice Johnson",
      discounts: 100,
    }),
    partial<QuoteData>({
      _key: { id: "Q2" },
      quoteNumber: "QT-2024-002",
      status: "draft",
      premium: 800,
      parties: [parties[1]],
      coverages: [coverages[0]],
      effectiveDate: "2024-02-01",
      agent: "Bob Wilson",
    }),
  ];

  return { quotes, parties, vehicles, drivers, violations, coverages };
}

describe("Core Integration: Entity + Collection + Immer", () => {
  const testData = createTestData();

  describe("All Collections Integration", () => {
    it("should demonstrate usage of all collection types", () => {
      // Quote Collection
      const quotes = new QuoteCollection(testData.quotes);
      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      const quote = activeQuotes.at(0);

      // Party Collection
      const parties = quote.getParties();
      const primaryParties = parties.getPrimaryParties();
      expect(primaryParties.length).toBe(1);

      const primaryParty = primaryParties.at(0);

      // Vehicle Collection
      const vehicles = primaryParty.getVehicles();
      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const ecoVehicles = vehicles.getEcoFriendlyVehicles();
      expect(ecoVehicles.length).toBe(1);
      expect(ecoVehicles.at(0).getDisplayName()).toBe("2021 Blue Honda Civic");

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).isHighMileage()).toBe(true);

      // Driver Collection
      const drivers = primaryParty.getDrivers();
      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1); // Jane is under 25

      const experiencedDrivers = drivers.getExperiencedDrivers();
      expect(experiencedDrivers.length).toBe(1); // John has 15 years experience

      const educatedDrivers = drivers.getEducatedDrivers();
      expect(educatedDrivers.length).toBe(2); // Both have education

      // Violation Collection
      const johnDriver = drivers.at(0);
      const violations = johnDriver.getViolations();
      expect(violations.length).toBe(2);
      expect(violations.getTotalPoints()).toBe(9);
      expect(violations.getTotalFines()).toBe(650);

      const recentViolations = violations.getRecent();
      expect(recentViolations.length).toBe(1); // Only speeding is recent

      const majorViolations = violations.getMajorViolations();
      expect(majorViolations.length).toBe(1); // Reckless driving is major (6 points)

      // Coverage Collection
      const coverages = quote.getCoverages();
      expect(coverages.length).toBe(2);
      expect(coverages.getTotalPremium()).toBe(1000);

      const requiredCoverages = coverages.getRequiredCoverages();
      expect(requiredCoverages.length).toBe(1); // Only liability is required

      const liabilityCoverage = coverages.getCoverageByType("liability");
      expect(liabilityCoverage?.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should demonstrate optional attributes usage", () => {
      const quotes = new QuoteCollection(testData.quotes);
      const quote = quotes.at(0);

      // Quote optional attributes
      expect(quote.getAgent()).toBe("Alice Johnson");
      expect(quote.getDiscounts()).toBe(100);
      expect(quote.getEffectiveDate()).toBe("2024-01-01");

      // Party optional attributes
      const primaryParty = quote.getPrimaryParty()!;
      expect(primaryParty.getAddress()).toBe(
        "123 Main St, San Francisco, CA 94102"
      );

      const contact = primaryParty.getContactInfo();
      expect(contact.phone).toBe("(555) 123-4567");
      expect(contact.email).toBe("john.doe@email.com");

      // Vehicle optional attributes
      const vehicle = primaryParty.getVehicles().at(0);
      expect(vehicle.getVin()).toBe("1HGBH41JXMN109186");
      expect(vehicle.isEcoFriendly()).toBe(true);
      expect(vehicle.getDisplayName()).toBe("2021 Blue Honda Civic");

      // Driver optional attributes
      const driver = primaryParty.getDrivers().at(0);
      expect(driver.getLicenseNumber()).toBe("DL123456789");
      expect(driver.isExperienced()).toBe(true);
      expect(driver.hasEducation()).toBe(true);

      // Violation optional attributes
      const violation = driver.getViolations().at(0);
      expect(violation.getFine()).toBe(150);
      expect(violation.getDescription()).toBe("Going 20mph over speed limit");

      // Coverage optional attributes
      const coverage = quote.getCoverages().at(0);
      expect(coverage.isRequired()).toBe(true);
      expect(coverage.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should show minimal data creation with only necessary attributes", () => {
      // Create quote with only required fields
      const minimalQuote = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-MINIMAL",
        status: "draft",
        premium: 500,
      });

      const quote = new QuoteEntity(minimalQuote);
      expect(quote.getQuoteNumber()).toBe("QT-MINIMAL");
      expect(quote.getPremium()).toBe(500);
      expect(quote.getAgent()).toBeUndefined();
      expect(quote.getParties().length).toBe(0);
      expect(quote.getCoverages().length).toBe(0);

      // Create vehicle with minimal data
      const minimalVehicle = partial<VehicleData>({
        _key: { id: "V3" },
        make: "Toyota",
        model: "Prius",
        year: 2023,
        value: 30000,
      });

      const vehicle = new VehicleEntity(minimalVehicle);
      expect(vehicle.getDisplayName()).toBe("2023 Toyota Prius"); // No color
      expect(vehicle.getVin()).toBeUndefined();
      expect(vehicle.isEcoFriendly()).toBe(false); // No fuelType specified
      expect(vehicle.isHighMileage()).toBe(false); // No mileage specified
    });
  });

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
          const vehicleCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getVehicles().length, 0);
          const driverCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getDrivers().length, 0);

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
        if (draft.coverages) {
          draft.coverages.push({
            _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
            type: "collision",
            limit: 75000,
            deductible: 500,
            premium: 300,
          });
        }

        // Update primary party's first vehicle value
        const primaryParty = draft.parties?.find((p) => p.type === "primary");
        if (
          primaryParty &&
          primaryParty.vehicles &&
          primaryParty.vehicles.length > 0
        ) {
          primaryParty.vehicles[0].value = 30000;
        }

        // Add a new violation to the first driver
        const firstDriver = primaryParty?.drivers?.[0];
        if (firstDriver && firstDriver.violations) {
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
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4); // 3 + 1 new point
    });

    it("should handle collection mutations with Immer", () => {
      const quotes = new QuoteCollection(testData.quotes);

      // Use Immer to create complex collection updates
      const newQuoteData = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
      });

      // Add new quote and update existing ones using collection methods (which use Immer internally)
      const expandedQuotes = quotes.push(newQuoteData).insertAt(
        1,
        partial<QuoteData>({
          _key: { id: "Q4" },
          quoteNumber: "QT-2024-004",
          status: "draft",
          premium: 750,
        })
      );

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
          if (activeQuote.parties) {
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
        }
      });

      // Verify original unchanged
      expect(portfolioData.metadata.version).toBe(1);
      expect(portfolioData.quotes[0].premium).toBe(1200);
      expect(portfolioData.quotes[0].parties?.length).toBe(2);

      // Verify updates
      expect(updatedPortfolio.metadata.version).toBe(2);
      expect(updatedPortfolio.quotes[0].premium).toBe(1350);
      expect(updatedPortfolio.quotes[0].parties?.length).toBe(3);

      // Use entity methods to verify the new party
      const updatedQuotes = new QuoteCollection(updatedPortfolio.quotes);
      const updatedQuote = updatedQuotes.at(0);
      const newPartyName =
        updatedQuote.getParties().at(2)?.getName() || "Not found";

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
      const firstDriverViolations = drivers?.at(0)?.getRecentViolations();

      expect(vehicles?.length).toBe(2);
      expect(drivers?.length).toBe(2);
      expect(firstDriverViolations?.length).toBe(1); // Only recent violations

      // Combine everything for business logic
      const riskAssessment = {
        hasClassicVehicles: vehicles?.toArray().some((v) => v.isClassic()),
        hasHighRiskDrivers: drivers?.toArray().some((d) => d.isHighRisk()),
        totalVehicleValue: vehicles
          ?.toArray()
          .reduce((sum, v) => sum + v.getValue(), 0),
        totalPoints: drivers
          ?.toArray()
          .reduce((sum, d) => sum + d.getTotalPoints(), 0),
      };

      expect(riskAssessment.hasClassicVehicles).toBe(true);
      expect(riskAssessment.hasHighRiskDrivers).toBe(true);
      expect(riskAssessment.totalVehicleValue).toBe(40000);
      expect(riskAssessment.totalPoints).toBe(3);
    });
  });
});
