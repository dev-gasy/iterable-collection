import { Entity } from "../../model/Entity";
import { Collection } from "../../model/Collection";
import { Vehicles } from "./Vehicle";
import { Drivers } from "./Driver";
import type { PartyData, QuoteData } from "./types";

export class Party extends Entity<PartyData, QuoteData> {
  getName(): string {
    return this.raw()?.name ?? "Unknown Party";
  }

  isPrimary(): boolean {
    return this.raw()?.type === "primary";
  }

  getVehicles(): Vehicles {
    const data = this.raw();
    return new Vehicles(data?.vehicles ?? [], data);
  }

  getDrivers(): Drivers {
    const data = this.raw();
    return new Drivers(data?.drivers ?? [], data);
  }

  getTotalVehicleValue(): number {
    return this.getVehicles().pipe((vehicles) => vehicles.getTotalValue());
  }

  hasHighRiskDrivers(): boolean {
    return this.getDrivers().pipe(
      (drivers) => drivers.getHighRiskDrivers().length > 0
    );
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

export class Parties extends Collection<PartyData, Party, QuoteData> {
  protected createEntity(data?: PartyData): Party {
    return new Party(data, this.parent);
  }

  getPrimaryParties(): Parties {
    return this.pipe((parties) => parties.filter((party) => party.isPrimary()));
  }

  getPartiesWithHighRisk(): Parties {
    return this.pipe((parties) =>
      parties.filter((party) => party.hasHighRiskDrivers())
    );
  }

  getTotalVehicleValue(): number {
    return this.pipe((parties) =>
      parties
        .toArray()
        .reduce((total, party) => total + party.getTotalVehicleValue(), 0)
    );
  }
}
