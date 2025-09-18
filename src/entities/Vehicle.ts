import { Entity } from "../model/Entity.ts";
import { Collection } from "../model/Collection.ts";
import type { BusinessEntity } from "../model/types.ts";
import type { PartyData } from "./Party.ts";

// Domain Data Types for entity/Entities tests
export interface VehicleData extends BusinessEntity {
  vin?: string;
  make: string;
  model: string;
  year: number;
  value: number;
  color?: string;
  mileage?: number;
  fuelType?: "gas" | "diesel" | "electric" | "hybrid";
}

export class Vehicle extends Entity<VehicleData, PartyData> {
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

export class Vehicles extends Collection<VehicleData, Vehicle, PartyData> {
  protected createEntity(data?: VehicleData): Vehicle {
    return new Vehicle(data, this.parent);
  }

  getClassicVehicles(): Vehicles {
    return this.pipe((vehicles) =>
      vehicles.filter((vehicle) => vehicle.isClassic())
    );
  }

  getTotalValue(): number {
    return this.pipe((vehicles) =>
      vehicles
        .toArray()
        .reduce((total, vehicle) => total + vehicle.getValue(), 0)
    );
  }

  getEcoFriendlyVehicles(): Vehicles {
    return this.pipe((vehicles) =>
      vehicles.filter((vehicle) => vehicle.isEcoFriendly())
    );
  }

  getHighMileageVehicles(): Vehicles {
    return this.pipe((vehicles) =>
      vehicles.filter((vehicle) => vehicle.isHighMileage())
    );
  }
}
