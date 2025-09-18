import { Entity } from "../model/Entity.ts";
import { Collection } from "../model/Collection.ts";
import { Parties, type PartyData } from "./Party.ts";
import { type CoverageData, Coverages } from "./Coverage.ts";
import type { BusinessEntity } from "../model/types.ts";
import type { Party } from "./Party.ts";

export interface QuoteData extends BusinessEntity {
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

export class Quote extends Entity<QuoteData, BusinessEntity> {
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

  getParties(): Parties {
    const data = this.raw();
    return new Parties(data?.parties, data);
  }

  getCoverages(): Coverages {
    const data = this.raw();
    return new Coverages(data?.coverages, data);
  }

  getPrimaryParty(): Party | undefined {
    return this.getParties().pipe((parties) =>
      parties.toArray().find((party) => party.isPrimary())
    );
  }

  getTotalVehicleValue(): number {
    return this.getParties().pipe((parties) =>
      parties
        .toArray()
        .reduce((total, party) => total + party.getTotalVehicleValue(), 0)
    );
  }

  isActive(): boolean {
    return this.getStatus() === "active";
  }

  hasHighRiskElements(): boolean {
    return this.getParties().pipe((parties) =>
      parties.toArray().some((party) => party.hasHighRiskDrivers())
    );
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

export class Quotes extends Collection<QuoteData, Quote, BusinessEntity> {
  protected createEntity(data?: QuoteData): Quote {
    return new Quote(data, this.parent);
  }

  getActiveQuotes(): Quotes {
    return this.pipe((quotes) => quotes.filter((quote) => quote.isActive()));
  }

  getHighRiskQuotes(): Quotes {
    return this.pipe((quotes) =>
      quotes.filter((quote) => quote.hasHighRiskElements())
    );
  }

  getTotalPremium(): number {
    return this.pipe((quotes) =>
      quotes.toArray().reduce((total, quote) => total + quote.getPremium(), 0)
    );
  }
}
