import type { BusinessEntity } from "../../model/types";

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

export interface ViolationData extends BusinessEntity {
  type: string;
  date: string;
  points: number;
  fine?: number;
  description?: string;
  location?: string;
}

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

export interface PartyData extends BusinessEntity {
  name: string;
  type: "primary" | "additional";
  vehicles?: VehicleData[];
  drivers?: DriverData[];
  address?: string;
  phone?: string;
  email?: string;
}

export interface CoverageData extends BusinessEntity {
  type: string;
  limit: number;
  deductible: number;
  premium: number;
  description?: string;
  isRequired?: boolean;
}

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
