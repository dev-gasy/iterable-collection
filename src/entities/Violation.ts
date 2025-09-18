import { Entity } from "../model/Entity.ts";
import { Collection } from "../model/Collection.ts";
import type { BusinessEntity } from "../model/types.ts";
import type { DriverData } from "./Driver.ts";

export interface ViolationData extends BusinessEntity {
  type: string;
  date: string;
  points: number;
  fine?: number;
  description?: string;
  location?: string;
}

export class ViolationEntity extends Entity<ViolationData, DriverData> {
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

export class Violations extends Collection<
  ViolationData,
  ViolationEntity,
  DriverData
> {
  protected createEntity(data?: ViolationData): ViolationEntity {
    return new ViolationEntity(data, this.parent);
  }

  getRecent(): Violations {
    return this.pipe((violations) =>
      violations.filter((violation) => violation.isRecent())
    );
  }

  getMajorViolations(): Violations {
    return this.pipe((violations) =>
      violations.filter((violation) => violation.isMajor())
    );
  }

  getTotalPoints(): number {
    return this.pipe((violations) =>
      violations
        .toArray()
        .reduce((total, violation) => total + violation.getPoints(), 0)
    );
  }

  getTotalFines(): number {
    return this.pipe((violations) =>
      violations
        .toArray()
        .reduce((total, violation) => total + violation.getFine(), 0)
    );
  }
}
