import { Entity } from "../../model/Entity";
import { Collection } from "../../model/Collection";
import type { CoverageData, QuoteData } from "./types";

export class Coverage extends Entity<CoverageData, QuoteData> {
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

export class Coverages extends Collection<CoverageData, Coverage, QuoteData> {
  protected createEntity(data?: CoverageData): Coverage {
    return new Coverage(data, this.parent);
  }

  getRequiredCoverages(): Coverages {
    return this.pipe(
      (coverages) => coverages.filter(coverage => coverage.isRequired())
    );
  }

  getTotalPremium(): number {
    return this.pipe(
      (coverages) => coverages.toArray().reduce((total, coverage) => total + coverage.getPremium(), 0)
    );
  }

  getCoverageByType(type: string): Coverage | undefined {
    return this.pipe(
      (coverages) => coverages.toArray().find(coverage => coverage.getType() === type)
    );
  }
}
