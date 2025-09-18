import { partial } from "../partial/utils";
import type {
  ViolationData,
  VehicleData,
  DriverData,
  PartyData,
  CoverageData,
  QuoteData,
} from "./entities";

// Test Data Creation Functions
export function createEntityTestData() {
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
