import { Entity } from "../model/Entity.ts";
import { Collection } from "../model/Collection.ts";
import { type ViolationData, Violations } from "./Violation.ts";
import type { BusinessEntity } from "../model/types.ts";
import type { PartyData } from "./Party.ts";

export interface DriverData extends BusinessEntity {
  licenseNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseState?: string;
  violations?: ViolationData[];
  experience?: number; // years of driving
  education?: "high_school" | "college" | "graduate";
}

export class Driver extends Entity<DriverData, PartyData> {
  getFullName(): string {
    const data = this.raw();
    return data ? `${data.firstName} ${data.lastName}` : "Unknown Driver";
  }

  getAge(): number {
    const birthDate = new Date(this.raw()?.dateOfBirth ?? "");
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  }

  getViolations(): Violations {
    const data = this.raw();
    return new Violations(data?.violations, data);
  }

  getRecentViolations(): Violations {
    return this.getViolations().pipe((violations) => violations.getRecent());
  }

  getTotalPoints(): number {
    return this.getRecentViolations().pipe((violations) =>
      violations.getTotalPoints()
    );
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

export class Drivers extends Collection<DriverData, Driver, PartyData> {
  protected createEntity(data?: DriverData): Driver {
    return new Driver(data, this.parent);
  }

  getHighRiskDrivers(): Drivers {
    return this.pipe((drivers) =>
      drivers.filter((driver) => driver.isHighRisk())
    );
  }

  getAverageAge(): number {
    return this.pipe((drivers) => {
      const driverArray = drivers.toArray();
      if (driverArray.length === 0) return 0;
      const totalAge = driverArray.reduce(
        (sum, driver) => sum + driver.getAge(),
        0
      );
      return totalAge / driverArray.length;
    });
  }

  getExperiencedDrivers(): Drivers {
    return this.pipe((drivers) =>
      drivers.filter((driver) => driver.isExperienced())
    );
  }

  getEducatedDrivers(): Drivers {
    return this.pipe((drivers) =>
      drivers.filter((driver) => driver.hasEducation())
    );
  }
}
