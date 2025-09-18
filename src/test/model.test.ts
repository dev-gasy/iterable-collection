import { describe, it, expect } from "vitest";
import { produce } from "immer";

import { any, partial } from "../partial/utils";
import type { BusinessEntity } from "../model/types";
import { Entity } from "../model/Entity";
import { Entities } from "../model/Entities";

// Test Data Type for basic IterableEntities tests
interface TestData extends BusinessEntity {
  name: string;
}

class TestEntity extends Entity<TestData, BusinessEntity> {
  getName(): string {
    return this.raw()?.name ?? "Unknown";
  }
}

class TestEntities extends Entities<TestData, TestEntity, BusinessEntity> {
  protected createEntity(data?: TestData): TestEntity {
    return new TestEntity(data, this.parent);
  }
}

// Domain Data Types for entity/Entitiess tests
interface VehicleData extends BusinessEntity {
  vin?: string;
  make: string;
  model: string;
  year: number;
  value: number;
  color?: string;
  mileage?: number;
  fuelType?: "gas" | "diesel" | "electric" | "hybrid";
}

interface ViolationData extends BusinessEntity {
  type: string;
  date: string;
  points: number;
  fine?: number;
  description?: string;
  location?: string;
}

interface DriverData extends BusinessEntity {
  licenseNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseState?: string;
  violations?: ViolationData[];
  experience?: number; // years of driving
  education?: "high_school" | "college" | "graduate";
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

interface CoverageData extends BusinessEntity {
  type: string;
  limit: number;
  deductible: number;
  premium: number;
  description?: string;
  isRequired?: boolean;
}

interface QuoteData extends BusinessEntity {
  quoteNumber: string;
  status: "draft" | "active" | "expired";
  premium: number;
  effectiveDate?: string;
  expirationDate?: string;
  parties?: PartyData[];
  coverages?: CoverageData[];
  agent?: string;
  discounts?: number;
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

  getViolations(): ViolationEntities {
    const data = this.raw();
    return new ViolationEntities(data?.violations ?? [], data);
  }

  getRecentViolations(): ViolationEntities {
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

  getVehicles(): VehicleEntities {
    const data = this.raw();
    return new VehicleEntities(data?.vehicles ?? [], data);
  }

  getDrivers(): DriverEntities {
    const data = this.raw();
    return new DriverEntities(data?.drivers ?? [], data);
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

  getParties(): PartyEntities {
    const data = this.raw();
    return new PartyEntities(data?.parties ?? [], data);
  }

  getCoverages(): CoverageEntities {
    const data = this.raw();
    return new CoverageEntities(data?.coverages ?? [], data);
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

// Entities Classes
class ViolationEntities extends Entities<
  ViolationData,
  ViolationEntity,
  DriverData
> {
  protected createEntity(data?: ViolationData): ViolationEntity {
    return new ViolationEntity(data, this.parent);
  }

  getRecent(): ViolationEntities {
    const recentData = this.toArray()
      .filter((violation) => violation.isRecent())
      .map((violation) => violation.raw())
      .filter((data): data is ViolationData => data != null);
    return new ViolationEntities(recentData, this.parent);
  }

  getMajorViolations(): ViolationEntities {
    const majorData = this.toArray()
      .filter((violation) => violation.isMajor())
      .map((violation) => violation.raw())
      .filter((data): data is ViolationData => data != null);
    return new ViolationEntities(majorData, this.parent);
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

class VehicleEntities extends Entities<VehicleData, VehicleEntity, PartyData> {
  protected createEntity(data?: VehicleData): VehicleEntity {
    return new VehicleEntity(data, this.parent);
  }

  getClassicVehicles(): VehicleEntities {
    const classicData = this.toArray()
      .filter((vehicle) => vehicle.isClassic())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleEntities(classicData, this.parent);
  }

  getTotalValue(): number {
    return this.toArray().reduce(
      (total, vehicle) => total + vehicle.getValue(),
      0
    );
  }

  getEcoFriendlyVehicles(): VehicleEntities {
    const ecoData = this.toArray()
      .filter((vehicle) => vehicle.isEcoFriendly())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleEntities(ecoData, this.parent);
  }

  getHighMileageVehicles(): VehicleEntities {
    const highMileageData = this.toArray()
      .filter((vehicle) => vehicle.isHighMileage())
      .map((vehicle) => vehicle.raw())
      .filter((data): data is VehicleData => data != null);
    return new VehicleEntities(highMileageData, this.parent);
  }
}

class DriverEntities extends Entities<DriverData, DriverEntity, PartyData> {
  protected createEntity(data?: DriverData): DriverEntity {
    return new DriverEntity(data, this.parent);
  }

  getHighRiskDrivers(): DriverEntities {
    const highRiskData = this.toArray()
      .filter((driver) => driver.isHighRisk())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverEntities(highRiskData, this.parent);
  }

  getAverageAge(): number {
    const drivers = this.toArray();
    if (drivers.length === 0) return 0;
    const totalAge = drivers.reduce((sum, driver) => sum + driver.getAge(), 0);
    return totalAge / drivers.length;
  }

  getExperiencedDrivers(): DriverEntities {
    const experiencedData = this.toArray()
      .filter((driver) => driver.isExperienced())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverEntities(experiencedData, this.parent);
  }

  getEducatedDrivers(): DriverEntities {
    const educatedData = this.toArray()
      .filter((driver) => driver.hasEducation())
      .map((driver) => driver.raw())
      .filter((data): data is DriverData => data != null);
    return new DriverEntities(educatedData, this.parent);
  }
}

class PartyEntities extends Entities<PartyData, PartyEntity, QuoteData> {
  protected createEntity(data?: PartyData): PartyEntity {
    return new PartyEntity(data, this.parent);
  }

  getPrimaryParties(): PartyEntities {
    const primaryData = this.toArray()
      .filter((party) => party.isPrimary())
      .map((party) => party.raw())
      .filter((data): data is PartyData => data != null);
    return new PartyEntities(primaryData, this.parent);
  }

  getPartiesWithHighRisk(): PartyEntities {
    const highRiskData = this.toArray()
      .filter((party) => party.hasHighRiskDrivers())
      .map((party) => party.raw())
      .filter((data): data is PartyData => data != null);
    return new PartyEntities(highRiskData, this.parent);
  }

  getTotalVehicleValue(): number {
    return this.toArray().reduce(
      (total, party) => total + party.getTotalVehicleValue(),
      0
    );
  }
}

class CoverageEntities extends Entities<
  CoverageData,
  CoverageEntity,
  QuoteData
> {
  protected createEntity(data?: CoverageData): CoverageEntity {
    return new CoverageEntity(data, this.parent);
  }

  getRequiredCoverages(): CoverageEntities {
    const requiredData = this.toArray()
      .filter((coverage) => coverage.isRequired())
      .map((coverage) => coverage.raw())
      .filter((data): data is CoverageData => data != null);
    return new CoverageEntities(requiredData, this.parent);
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

class QuoteEntities extends Entities<QuoteData, QuoteEntity, BusinessEntity> {
  protected createEntity(data?: QuoteData): QuoteEntity {
    return new QuoteEntity(data, this.parent);
  }

  getActiveQuotes(): QuoteEntities {
    const activeData = this.toArray()
      .filter((quote) => quote.isActive())
      .map((quote) => quote.raw())
      .filter((data): data is QuoteData => data != null);
    return new QuoteEntities(activeData);
  }

  getHighRiskQuotes(): QuoteEntities {
    const highRiskData = this.toArray()
      .filter((quote) => quote.hasHighRiskElements())
      .map((quote) => quote.raw())
      .filter((data): data is QuoteData => data != null);
    return new QuoteEntities(highRiskData);
  }

  getTotalPremium(): number {
    return this.toArray().reduce(
      (total, quote) => total + quote.getPremium(),
      0
    );
  }
}

// Test Data Creation Functions
function createEntityTestData() {
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

describe("Entities", () => {
  describe("Constructor", () => {
    it("should create empty Entities", () => {
      // Arrange & Act
      const Entities = new TestEntities();

      // Assert
      expect(Entities.length).toBe(0);
    });

    it("should create Entities with initial items", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];

      // Act
      const Entities = new TestEntities(items);

      // Assert
      expect(Entities.length).toBe(2);
    });
  });

  describe("Basic Operations", () => {
    it("should return entity at valid index", () => {
      // Arrange
      const item = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const Entities = new TestEntities([item]);

      // Act
      const result = Entities.at(0);

      // Assert
      expect(result).toBeInstanceOf(TestEntity);
      expect(result?.id()).toBe("1");
    });

    it("should return entity with undefined data for invalid index", () => {
      // Arrange
      const Entities = new TestEntities();

      // Act
      const result1 = Entities.at(0);
      const result2 = Entities.at(-1);

      // Assert
      expect(result1).toBeInstanceOf(TestEntity);
      expect(result1.id()).toBeUndefined();
      expect(result2).toBeInstanceOf(TestEntity);
      expect(result2.id()).toBeUndefined();
    });

    it("should return correct length", () => {
      // Arrange
      const Entities = new TestEntities();

      // Act & Assert - empty Entities
      expect(Entities.length).toBe(0);

      // Act & Assert - after first push
      const Entities1 = Entities.push(
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" })
      );
      expect(Entities1.length).toBe(1);

      // Act & Assert - after second push
      const Entities2 = Entities1.push(
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" })
      );
      expect(Entities2.length).toBe(2);
    });
  });

  describe("Iterator", () => {
    it("should iterate over empty Entities", () => {
      // Arrange
      const Entities = new TestEntities();

      // Act
      const entities = Array.from(Entities);

      // Assert
      expect(entities).toEqual([]);
    });

    it("should iterate over entities using for...of", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const Entities = new TestEntities(items);

      // Act
      const result = [];
      for (const entity of Entities) {
        result.push(entity);
      }

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
      expect(result[2]).toBeInstanceOf(TestEntity);
      expect(result[2].id()).toBe("3");
    });

    it("should work with Array.from", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);

      // Act
      const result = Array.from(Entities);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should work with spread operator", () => {
      // Arrange
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);

      // Act
      const result = [...Entities];

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should work with manual iterator", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const iterator = Entities[Symbol.iterator]();

      let result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("1");

      result = iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toBeInstanceOf(TestEntity);
      expect((result.value as TestEntity).id()).toBe("2");

      result = iterator.next();
      expect(result.done).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe("Mutation Operations", () => {
    it("should return new Entities with added item", () => {
      const Entities = new TestEntities();
      const item = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const newEntities = Entities.push(item);

      expect(Entities.length).toBe(0);
      expect(newEntities.length).toBe(1);
      expect(newEntities.at(0)).toBeInstanceOf(TestEntity);
      expect(newEntities.at(0).id()).toBe("1");
      expect(newEntities).not.toBe(Entities);
    });

    it("should support fluent chaining with new instances", () => {
      const Entities = new TestEntities();
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = Entities.push(item1).push(item2);

      expect(result).not.toBe(Entities);
      expect(Entities.length).toBe(0);
      expect(result.length).toBe(2);
      expect(result.at(0)).toBeInstanceOf(TestEntity);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1)).toBeInstanceOf(TestEntity);
      expect(result.at(1).id()).toBe("2");
    });

    it("should maintain immutability when pushing multiple items", () => {
      const Entities = new TestEntities();
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const item3 = partial<TestData>({ _key: { id: "3" }, name: "Item 3" });

      const step1 = Entities.push(item1);
      const step2 = step1.push(item2);
      const step3 = step2.push(item3);

      expect(Entities.length).toBe(0);
      expect(step1.length).toBe(1);
      expect(step2.length).toBe(2);
      expect(step3.length).toBe(3);
      expect(step1.at(0).id()).toBe("1");
      expect(step2.at(1).id()).toBe("2");
      expect(step3.at(2).id()).toBe("3");
    });
  });

  describe("Insert and Remove Operations", () => {
    it("should insert item at valid index", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const Entities = new TestEntities(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = Entities.insertAt(1, newItem);

      expect(result.length).toBe(3);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
      expect(result.at(2).id()).toBe("3");
    });

    it("should insert at beginning when index is 0", () => {
      const items = [partial<TestData>({ _key: { id: "2" }, name: "Item 2" })];
      const Entities = new TestEntities(items);
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = Entities.insertAt(0, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should insert at end when index equals length", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = Entities.insertAt(1, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp negative index to 0", () => {
      const items = [partial<TestData>({ _key: { id: "2" }, name: "Item 2" })];
      const Entities = new TestEntities(items);
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = Entities.insertAt(-5, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should clamp large index to length", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const newItem = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const result = Entities.insertAt(999, newItem);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty Entities", () => {
      const Entities = new TestEntities();
      const newItem = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const result = Entities.insertAt(0, newItem);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should remove item at valid index", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(1);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("3");
    });

    it("should remove first item", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(0);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("2");
    });

    it("should remove last item", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(1);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should handle negative index in remove", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(-1);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should handle index beyond bounds in remove", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(999);

      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should work on single item Entities", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const result = Entities.removeAt(0);

      expect(result.length).toBe(0);
    });

    it("should work on empty Entities", () => {
      const Entities = new TestEntities();
      const result = Entities.removeAt(0);

      expect(result.length).toBe(0);
    });
  });

  describe("Filter and Map Operations", () => {
    it("should filter items based on predicate", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.filter(
        (entity, index) => entity.id() === "2" || index === 2
      );

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("2");
      expect(result.at(1).id()).toBe("3");
    });

    it("should return empty Entities when no items match", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.filter(() => false);

      expect(result.length).toBe(0);
    });

    it("should return all items when all match", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.filter(() => true);

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(result.at(1).id()).toBe("2");
    });

    it("should work on empty Entities", () => {
      const Entities = new TestEntities();
      const result = Entities.filter(() => true);

      expect(result.length).toBe(0);
    });

    it("should provide correct index to predicate", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" }),
      ];
      const Entities = new TestEntities(items);
      const indices: number[] = [];

      Entities.filter((_, index) => {
        indices.push(index);
        return true;
      });

      expect(indices).toEqual([0, 1, 2]);
    });

    it("should transform items using mapper function", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.map((entity) => entity.id());

      expect(result).toEqual(["1", "2"]);
    });

    it("should provide correct index to mapper", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.map((entity, index) => `${entity.id()}-${index}`);

      expect(result).toEqual(["1-0", "2-1"]);
    });

    it("should work on empty Entities", () => {
      const Entities = new TestEntities();
      const result = Entities.map((entity) => entity.id());

      expect(result).toEqual([]);
    });

    it("should support complex transformations", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.map((entity) => ({
        id: entity.id(),
        hasData: entity.raw() !== undefined,
        name: entity.raw()?.name,
      }));

      expect(result).toEqual([
        { id: "1", hasData: true, name: "Item 1" },
        { id: "2", hasData: true, name: "Item 2" },
      ]);
    });
  });

  describe("Array Conversion", () => {
    it("should return array of entities", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.toArray();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].id()).toBe("1");
      expect(result[1]).toBeInstanceOf(TestEntity);
      expect(result[1].id()).toBe("2");
    });

    it("should return empty array for empty Entities", () => {
      const Entities = new TestEntities();
      const result = Entities.toArray();

      expect(result).toEqual([]);
    });

    it("should return new array instance", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const result1 = Entities.toArray();
      const result2 = Entities.toArray();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it("should return readonly array of data", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);
      const result = Entities.toDataArray();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(items[0]);
      expect(result[1]).toEqual(items[1]);
    });

    it("should return immutable reference to internal data", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);
      const result = Entities.toDataArray();

      expect(result).toBe(Entities.toDataArray());
    });
  });

  describe("Factory Method", () => {
    it("should create new instance with same type", () => {
      const Entities = new TestEntities();
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const result = Entities.create(items);

      expect(result).toBeInstanceOf(TestEntities);
      expect(result).not.toBe(Entities);
      expect(result.length).toBe(1);
      expect(result.at(0).id()).toBe("1");
    });

    it("should preserve parent reference", () => {
      const parent = { _key: { rootId: "parent", revisionNo: 1 } };
      const Entities = new TestEntities([], parent);
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const result = Entities.create(items);

      expect(result).toBeInstanceOf(TestEntities);
      expect(result.length).toBe(1);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null/undefined data items gracefully", () => {
      const items: TestData[] = [
        any(null),
        any(undefined),
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
      ];
      const Entities = new TestEntities(items.filter(Boolean) as TestData[]);

      expect(Entities.length).toBe(1);
      expect(Entities.at(0).id()).toBe("1");
    });

    it("should handle Entitiess with mixed valid/invalid data", () => {
      const Entities = new TestEntities([
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
      ]);
      const result = Entities.push(any({ invalid: "data" }));

      expect(result.length).toBe(2);
      expect(result.at(0).id()).toBe("1");
      expect(() => result.at(1).id()).not.toThrow();
      expect(result.at(1).id()).toBeUndefined();
    });

    it("should handle very large Entitiess", () => {
      const items = Array.from({ length: 10000 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );
      const Entities = new TestEntities(items);

      expect(Entities.length).toBe(10000);
      expect(Entities.at(0).id()).toBe("0");
      expect(Entities.at(9999).id()).toBe("9999");

      let count = 0;
      for (const _ of Entities) {
        count++;
        if (count > 100) break;
      }
      expect(count).toBe(101);
    });

    it("should handle concurrent modifications safely", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);

      const results = Array.from({ length: 100 }, (_, i) =>
        Entities.push(
          partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
        )
      );

      expect(Entities.length).toBe(1);
      expect(results[0].length).toBe(2);
      expect(results[99].length).toBe(2);
    });

    it("should handle circular reference protection", () => {
      const item1 = partial<TestData>({ _key: { id: "1" }, name: "Item 1" });
      const item2 = partial<TestData>({ _key: { id: "2" }, name: "Item 2" });
      const Entities = new TestEntities([item1, item2]);

      const entity1 = Entities.at(0);
      const entity2 = Entities.at(1);

      expect(entity1.raw()).toBe(item1);
      expect(entity2.raw()).toBe(item2);
      expect(entity1).not.toBe(entity2);
    });

    it("should handle memory efficiency with repeated access", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);

      const entities = Array.from({ length: 1000 }, () => Entities.at(0));

      entities.forEach((entity) => {
        expect(entity).toBeInstanceOf(TestEntity);
        expect(entity.id()).toBe("1");
      });
    });

    it("should preserve data integrity during transformations", () => {
      const originalData = partial<TestData>({
        _key: { id: "1" },
        name: "Original",
      });
      const Entities = new TestEntities([originalData]);

      const filtered = Entities.filter(() => true);
      const mapped = Entities.map((entity) => entity.raw());
      const arrayForm = Entities.toArray();

      expect(originalData.name).toBe("Original");
      expect(filtered.at(0).raw()?.name).toBe("Original");
      expect(mapped[0]?.name).toBe("Original");
      expect(arrayForm[0].raw()?.name).toBe("Original");
    });

    it("should handle floating point indices gracefully", () => {
      const items = [
        partial<TestData>({ _key: { id: "1" }, name: "Item 1" }),
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" }),
      ];
      const Entities = new TestEntities(items);

      const result1 = Entities.insertAt(
        0.7,
        partial<TestData>({ _key: { id: "0" }, name: "Item 0" })
      );
      const result2 = Entities.removeAt(1.9);

      expect(result1.at(0).id()).toBe("0");
      expect(result2.length).toBe(1);
    });

    it("should handle Infinity and NaN indices", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);

      const infinityResult = Entities.insertAt(
        Infinity,
        partial<TestData>({ _key: { id: "2" }, name: "Item 2" })
      );
      const nanResult = Entities.insertAt(
        NaN,
        partial<TestData>({ _key: { id: "3" }, name: "Item 3" })
      );

      expect(infinityResult.length).toBe(2);
      expect(nanResult.length).toBe(2);
    });
  });

  describe("Performance Characteristics", () => {
    it("should maintain O(n) performance for basic operations", () => {
      const sizes = [100, 1000];
      const results: number[] = [];

      sizes.forEach((size) => {
        const items = Array.from({ length: size }, (_, i) =>
          partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
        );
        const Entities = new TestEntities(items);

        const start = performance.now();
        Entities.push(
          partial<TestData>({ _key: { id: "new" }, name: "New Item" })
        );
        const end = performance.now();

        results.push(end - start);
      });

      expect(results[0]).toBeLessThan(10);
      expect(results[1]).toBeLessThan(50);
    });

    it("should handle rapid successive operations efficiently", () => {
      const Entities = new TestEntities();
      const items = Array.from({ length: 100 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );

      const start = performance.now();
      let result = Entities;

      for (const item of items) {
        result = result.push(item);
      }

      const end = performance.now();

      expect(result.length).toBe(100);
      expect(end - start).toBeLessThan(100);
    });

    it("should optimize iteration performance", () => {
      const items = Array.from({ length: 1000 }, (_, i) =>
        partial<TestData>({ _key: { id: i.toString() }, name: `Item ${i}` })
      );
      const Entities = new TestEntities(items);

      const start = performance.now();

      let count = 0;
      for (const entity of Entities) {
        count++;
        entity.id();
      }

      const end = performance.now();

      expect(count).toBe(1000);
      expect(end - start).toBeLessThan(50);
    });
  });

  describe("Type Safety and Generics", () => {
    it("should maintain type safety through transformations", () => {
      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const Entities = new TestEntities(items);

      const filtered: TestEntities = Entities.filter(() => true);
      const mapped: string[] = Entities.map((entity) => entity.id() || "");
      const entities: TestEntity[] = Entities.toArray();
      const data: readonly TestData[] = Entities.toDataArray();

      expect(filtered).toBeInstanceOf(TestEntities);
      expect(Array.isArray(mapped)).toBe(true);
      expect(Array.isArray(entities)).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should work with inheritance hierarchies", () => {
      class ExtendedTestEntity extends TestEntity {
        getDisplayName(): string {
          return this.raw()?.name || "Unknown";
        }
      }

      class ExtendedTestEntities extends Entities<
        TestData,
        ExtendedTestEntity,
        BusinessEntity
      > {
        protected createEntity(data?: TestData): ExtendedTestEntity {
          return new ExtendedTestEntity(data);
        }
      }

      const items = [partial<TestData>({ _key: { id: "1" }, name: "Item 1" })];
      const entities = new ExtendedTestEntities(items, undefined);

      const entity = entities.at(0);
      const displayName = entity.getDisplayName();

      expect(entity).toBeInstanceOf(ExtendedTestEntity);
      expect(displayName).toBe("Item 1");
    });
  });
});

describe("Entity and Entities Tests", () => {
  const testData = createEntityTestData();

  describe("Entity Functionality", () => {
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
      expect(driver.getTotalPoints()).toBe(3);
      expect(driver.isHighRisk()).toBe(false);

      const youngDriver = new DriverEntity(testData.drivers[1]);
      expect(youngDriver.isHighRisk()).toBe(true);
    });

    it("should identify classic vehicles", () => {
      const modernVehicle = new VehicleEntity(testData.vehicles[0]);
      const classicVehicle = new VehicleEntity(testData.vehicles[1]);

      expect(modernVehicle.isClassic()).toBe(false);
      expect(classicVehicle.isClassic()).toBe(true);
      expect(classicVehicle.getDisplayName()).toBe("1995 Black BMW 3 Series");
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

  describe("IterableEntities Functionality", () => {
    it("should work with quote Entitiess", () => {
      const quotes = new QuoteEntities(testData.quotes);

      expect(quotes.length).toBe(2);
      expect(quotes.getTotalPremium()).toBe(2000);

      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);
      expect(activeQuotes.at(0).getQuoteNumber()).toBe("QT-2024-001");

      const highRiskQuotes = quotes.getHighRiskQuotes();
      expect(highRiskQuotes.length).toBe(1);
    });

    it("should work with vehicle Entitiess", () => {
      const vehicles = new VehicleEntities(testData.vehicles);

      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).getDisplayName()).toBe(
        "1995 Black BMW 3 Series"
      );
    });

    it("should work with driver Entitiess", () => {
      const drivers = new DriverEntities(testData.drivers);

      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1);
      expect(highRiskDrivers.at(0).getFullName()).toBe("Jane Smith");
    });

    it("should preserve immutability", () => {
      const quotes = new QuoteEntities(testData.quotes);
      const originalLength = quotes.length;

      const newQuotes = quotes.push(partial({ _key: { id: "Q3" } }));

      expect(quotes.length).toBe(originalLength);
      expect(newQuotes.length).toBe(originalLength + 1);
      expect(quotes).not.toBe(newQuotes);
    });

    it("should handle index bounds safely", () => {
      const quotes = new QuoteEntities(testData.quotes);

      const outOfBounds = quotes.at(999);
      expect(outOfBounds).toBeDefined();
      expect(outOfBounds.raw()).toBeUndefined();

      const negative = quotes.at(-1);
      expect(negative).toBeDefined();
      expect(negative.raw()).toBeUndefined();
    });
  });

  describe("Immer Integration with Entities and Entitiess", () => {
    it("should demonstrate complex state updates with Immer", () => {
      const quotes = new QuoteEntities(testData.quotes);
      const originalQuote = quotes.at(0);

      const updatedQuoteData = produce(originalQuote.raw()!, (draft) => {
        draft.premium = 1500;

        if (draft.coverages) {
          draft.coverages.push({
            _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
            type: "collision",
            limit: 75000,
            deductible: 500,
            premium: 300,
          });
        }

        const primaryParty = draft.parties?.find((p) => p.type === "primary");
        if (primaryParty?.vehicles && primaryParty?.vehicles?.length > 0) {
          primaryParty.vehicles[0].value = 30000;
        }

        const firstDriver = primaryParty?.drivers?.[0];

        if (firstDriver?.violations) {
          firstDriver.violations.push({
            _key: { rootId: "violations", revisionNo: 1, id: "V3" },
            type: "parking",
            date: "2024-01-15",
            points: 1,
          });
        }
      });

      const updatedQuote = new QuoteEntities([updatedQuoteData]).at(0);

      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4);
    });

    it("should handle Entities mutations with Immer", () => {
      const quotes = new QuoteEntities(testData.quotes);

      const newQuoteData = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
      });

      const expandedQuotes = quotes.push(newQuoteData).insertAt(
        1,
        partial({
          _key: { id: "Q4" },
          quoteNumber: "QT-2024-004",
          status: "draft",
          premium: 750,
        })
      );

      expect(quotes.length).toBe(2);
      expect(expandedQuotes.length).toBe(4);
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });
  });

  describe("Performance and Optimization", () => {
    it("should demonstrate entity caching performance", () => {
      const quotes = new QuoteEntities(testData.quotes);

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

      expect(cached).toBeLessThan(uncached * 5);
    });
  });

  describe("Advanced Entities Patterns", () => {
    it("should support Entities chaining and filtering", () => {
      const quotes = new QuoteEntities(testData.quotes);

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
      const quotes = new QuoteEntities(testData.quotes);
      const firstQuote = quotes.at(0);

      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      const vehicles = primaryParty?.getVehicles();
      expect(vehicles?.length).toBe(2);

      const drivers = primaryParty?.getDrivers();
      expect(drivers?.length).toBe(2);

      const classicVehicle = vehicles?.toArray().find((v) => v.isClassic());
      expect(classicVehicle).toBeDefined();
      expect(classicVehicle!.getDisplayName()).toBe("1995 Black BMW 3 Series");

      const highRiskDriver = drivers?.toArray().find((d) => d.isHighRisk());
      expect(highRiskDriver).toBeDefined();
      expect(highRiskDriver!.getFullName()).toBe("Jane Smith");
    });
  });
});

describe("Core Integration: Entity + Entities + Immer", () => {
  const testData = createEntityTestData();

  describe("All Entitiess Integration", () => {
    it("should demonstrate usage of all Entities types", () => {
      const quotes = new QuoteEntities(testData.quotes);
      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      const quote = activeQuotes.at(0);

      const parties = quote.getParties();
      const primaryParties = parties.getPrimaryParties();
      expect(primaryParties.length).toBe(1);

      const primaryParty = primaryParties.at(0);

      const vehicles = primaryParty.getVehicles();
      expect(vehicles.length).toBe(2);
      expect(vehicles.getTotalValue()).toBe(40000);

      const ecoVehicles = vehicles.getEcoFriendlyVehicles();
      expect(ecoVehicles.length).toBe(1);
      expect(ecoVehicles.at(0).getDisplayName()).toBe("2021 Blue Honda Civic");

      const classicVehicles = vehicles.getClassicVehicles();
      expect(classicVehicles.length).toBe(1);
      expect(classicVehicles.at(0).isHighMileage()).toBe(true);

      const drivers = primaryParty.getDrivers();
      expect(drivers.length).toBe(2);
      expect(drivers.getAverageAge()).toBeGreaterThan(25);

      const highRiskDrivers = drivers.getHighRiskDrivers();
      expect(highRiskDrivers.length).toBe(1);

      const experiencedDrivers = drivers.getExperiencedDrivers();
      expect(experiencedDrivers.length).toBe(1);

      const educatedDrivers = drivers.getEducatedDrivers();
      expect(educatedDrivers.length).toBe(2);

      const johnDriver = drivers.at(0);
      const violations = johnDriver.getViolations();
      expect(violations.length).toBe(2);
      expect(violations.getTotalPoints()).toBe(9);
      expect(violations.getTotalFines()).toBe(650);

      const recentViolations = violations.getRecent();
      expect(recentViolations.length).toBe(1);

      const majorViolations = violations.getMajorViolations();
      expect(majorViolations.length).toBe(1);

      const coverages = quote.getCoverages();
      expect(coverages.length).toBe(2);
      expect(coverages.getTotalPremium()).toBe(1000);

      const requiredCoverages = coverages.getRequiredCoverages();
      expect(requiredCoverages.length).toBe(1);

      const liabilityCoverage = coverages.getCoverageByType("liability");
      expect(liabilityCoverage?.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should demonstrate optional attributes usage", () => {
      const quotes = new QuoteEntities(testData.quotes);
      const quote = quotes.at(0);

      expect(quote.getAgent()).toBe("Alice Johnson");
      expect(quote.getDiscounts()).toBe(100);
      expect(quote.getEffectiveDate()).toBe("2024-01-01");

      const primaryParty = quote.getPrimaryParty()!;
      expect(primaryParty.getAddress()).toBe(
        "123 Main St, San Francisco, CA 94102"
      );

      const contact = primaryParty.getContactInfo();
      expect(contact.phone).toBe("(555) 123-4567");
      expect(contact.email).toBe("john.doe@email.com");

      const vehicle = primaryParty.getVehicles().at(0);
      expect(vehicle.getVin()).toBe("1HGBH41JXMN109186");
      expect(vehicle.isEcoFriendly()).toBe(true);
      expect(vehicle.getDisplayName()).toBe("2021 Blue Honda Civic");

      const driver = primaryParty.getDrivers().at(0);
      expect(driver.getLicenseNumber()).toBe("DL123456789");
      expect(driver.isExperienced()).toBe(true);
      expect(driver.hasEducation()).toBe(true);

      const violation = driver.getViolations().at(0);
      expect(violation.getFine()).toBe(150);
      expect(violation.getDescription()).toBe("Going 20mph over speed limit");

      const coverage = quote.getCoverages().at(0);
      expect(coverage.isRequired()).toBe(true);
      expect(coverage.getDescription()).toBe(
        "Bodily injury and property damage liability"
      );
    });

    it("should show minimal data creation with only necessary attributes", () => {
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

      const minimalVehicle = partial<VehicleData>({
        _key: { id: "V3" },
        make: "Toyota",
        model: "Prius",
        year: 2023,
        value: 30000,
      });

      const vehicle = new VehicleEntity(minimalVehicle);
      expect(vehicle.getDisplayName()).toBe("2023 Toyota Prius");
      expect(vehicle.getVin()).toBeUndefined();
      expect(vehicle.isEcoFriendly()).toBe(false);
      expect(vehicle.isHighMileage()).toBe(false);
    });
  });

  describe("Core Integration Patterns", () => {
    it("should integrate entities and Entitiess", () => {
      const quotes = new QuoteEntities(testData.quotes);

      const activeQuotes = quotes.getActiveQuotes();
      const firstQuote = activeQuotes.at(0);

      expect(firstQuote.getQuoteNumber()).toBe("QT-2024-001");
      expect(firstQuote.isActive()).toBe(true);

      const primaryPartyName =
        firstQuote.getPrimaryParty()?.getName() || "Unknown";

      expect(primaryPartyName).toBe("John Doe");

      const riskAnalysis = activeQuotes.toArray().map((quote) => {
        const primaryParty = quote.getPrimaryParty();
        const vehicles = primaryParty?.getVehicles() || [];

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
      const quotes = new QuoteEntities(testData.quotes);

      const quoteSummaries = quotes
        .toArray()
        .map((quote) => {
          const raw = quote.raw();
          if (!raw) return null;

          const parties = quote.getParties();
          const vehicleCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getVehicles().length, 0);
          const driverCount = parties
            .toArray()
            .reduce((sum, party) => sum + party.getDrivers().length, 0);

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

  describe("Immer Integration", () => {
    it("should demonstrate complex state updates with Immer", () => {
      const quotes = new QuoteEntities(testData.quotes);
      const originalQuote = quotes.at(0);

      const updatedQuoteData = produce(originalQuote.raw()!, (draft) => {
        draft.premium = 1500;

        if (draft.coverages) {
          draft.coverages.push({
            _key: { rootId: "coverages", revisionNo: 1, id: "C3" },
            type: "collision",
            limit: 75000,
            deductible: 500,
            premium: 300,
          });
        }

        const primaryParty = draft.parties?.find((p) => p.type === "primary");
        if (
          primaryParty &&
          primaryParty.vehicles &&
          primaryParty.vehicles.length > 0
        ) {
          primaryParty.vehicles[0].value = 30000;
        }

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

      const updatedQuotes = new QuoteEntities([updatedQuoteData]);
      const updatedQuote = updatedQuotes.at(0);

      expect(originalQuote.getPremium()).toBe(1200);
      expect(originalQuote.getCoverages().length).toBe(2);

      expect(updatedQuote.getPremium()).toBe(1500);
      expect(updatedQuote.getCoverages().length).toBe(3);
      expect(updatedQuote.getCoverages().at(2).getType()).toBe("collision");

      const updatedPrimaryParty = updatedQuote.getPrimaryParty();
      expect(updatedPrimaryParty?.getVehicles().at(0).getValue()).toBe(30000);
      expect(updatedPrimaryParty?.getDrivers().at(0).getTotalPoints()).toBe(4);
    });

    it("should handle Entities mutations with Immer", () => {
      const quotes = new QuoteEntities(testData.quotes);

      const newQuoteData = partial<QuoteData>({
        _key: { id: "Q3" },
        quoteNumber: "QT-2024-003",
        status: "active",
        premium: 950,
      });

      const expandedQuotes = quotes.push(newQuoteData).insertAt(
        1,
        partial<QuoteData>({
          _key: { id: "Q4" },
          quoteNumber: "QT-2024-004",
          status: "draft",
          premium: 750,
        })
      );

      expect(quotes.length).toBe(2);
      expect(expandedQuotes.length).toBe(4);
      expect(expandedQuotes.at(1).getQuoteNumber()).toBe("QT-2024-004");
      expect(expandedQuotes.at(3).getQuoteNumber()).toBe("QT-2024-003");
    });

    it("should combine Immer with entity methods for complex updates", () => {
      const portfolioData = {
        quotes: testData.quotes,
        metadata: { version: 1, lastUpdated: "2024-01-01" },
      };

      const updatedPortfolio = produce(portfolioData, (draft) => {
        draft.metadata.version = 2;
        draft.metadata.lastUpdated = "2024-01-15";

        const activeQuote = draft.quotes.find((q) => q.status === "active");
        if (activeQuote) {
          activeQuote.premium = 1350;

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

      expect(portfolioData.metadata.version).toBe(1);
      expect(portfolioData.quotes[0].premium).toBe(1200);
      expect(portfolioData.quotes[0].parties?.length).toBe(2);

      expect(updatedPortfolio.metadata.version).toBe(2);
      expect(updatedPortfolio.quotes[0].premium).toBe(1350);
      expect(updatedPortfolio.quotes[0].parties?.length).toBe(3);

      const updatedQuotes = new QuoteEntities(updatedPortfolio.quotes);
      const updatedQuote = updatedQuotes.at(0);
      const newPartyName =
        updatedQuote.getParties().at(2)?.getName() || "Not found";

      expect(newPartyName).toBe("Secondary Driver");
    });
  });

  describe("Combined Usage Patterns", () => {
    it("should demonstrate end-to-end workflow with entities and Entitiess", () => {
      const quotes = new QuoteEntities(testData.quotes);

      const activeQuotes = quotes.getActiveQuotes();
      expect(activeQuotes.length).toBe(1);

      const firstQuote = activeQuotes.at(0);
      const primaryParty = firstQuote.getPrimaryParty();
      expect(primaryParty).toBeDefined();

      const vehicles = primaryParty?.getVehicles();
      const drivers = primaryParty?.getDrivers();

      const firstDriverViolations = drivers?.at(0)?.getRecentViolations();

      expect(vehicles?.length).toBe(2);
      expect(drivers?.length).toBe(2);
      expect(firstDriverViolations?.length).toBe(1);

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
