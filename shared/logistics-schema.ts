import { pgTable, text, serial, timestamp, decimal, boolean, integer, varchar, index, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// LOGISTICS MANAGEMENT SCHEMA
// =============================================================================

// Transportation Companies/Providers
export const transportationCompanies = pgTable("transportation_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  
  // Service capabilities
  serviceTypes: text("service_types").array(), // ['motorcycle', 'car', 'truck', 'van']
  coverageAreas: text("coverage_areas").array(), // Cities/provinces they cover
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }), // kg
  maxVolume: decimal("max_volume", { precision: 8, scale: 2 }), // cubic meters
  
  // Pricing
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }),
  ratePerKm: decimal("rate_per_km", { precision: 6, scale: 2 }),
  ratePerKg: decimal("rate_per_kg", { precision: 6, scale: 2 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalDeliveries: integer("total_deliveries").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("transportation_companies_active_idx").on(table.isActive),
  index("transportation_companies_service_idx").on(table.serviceTypes),
]);

// Vehicles used for delivery
export const deliveryVehicles = pgTable("delivery_vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => transportationCompanies.id),
  
  // Vehicle details
  vehicleType: varchar("vehicle_type", { length: 50 }).notNull(), // motorcycle, car, truck, van
  make: text("make"), // Toyota, Honda, etc.
  model: text("model"),
  year: integer("year"),
  color: text("color"),
  plateNumber: varchar("plate_number", { length: 20 }).unique().notNull(),
  
  // Capacity
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }).notNull(), // kg
  maxVolume: decimal("max_volume", { precision: 8, scale: 2 }), // cubic meters
  fuelType: varchar("fuel_type", { length: 20 }), // petrol, diesel, electric, hybrid
  
  // Insurance and documentation
  insuranceNumber: text("insurance_number"),
  insuranceExpiry: timestamp("insurance_expiry"),
  licenseExpiry: timestamp("license_expiry"),
  
  // Status
  isActive: boolean("is_active").default(true),
  currentStatus: varchar("current_status", { length: 20 }).default("available"), // available, assigned, in_transit, maintenance
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_vehicles_company_idx").on(table.companyId),
  index("delivery_vehicles_type_idx").on(table.vehicleType),
  index("delivery_vehicles_status_idx").on(table.currentStatus),
  index("delivery_vehicles_plate_idx").on(table.plateNumber),
]);

// Delivery personnel/drivers
export const deliveryPersonnel = pgTable("delivery_personnel", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => transportationCompanies.id),
  vehicleId: integer("vehicle_id").references(() => deliveryVehicles.id),
  
  // Personal information
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  email: text("email"),
  nationalId: varchar("national_id", { length: 20 }).unique(),
  
  // Driver license
  licenseNumber: varchar("license_number", { length: 30 }).unique().notNull(),
  licenseType: varchar("license_type", { length: 10 }).notNull(), // A, B, C, D
  licenseExpiry: timestamp("license_expiry").notNull(),
  
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  
  // Work details
  workStartTime: varchar("work_start_time", { length: 8 }), // HH:MM:SS
  workEndTime: varchar("work_end_time", { length: 8 }), // HH:MM:SS
  workDays: text("work_days").array(), // ['monday', 'tuesday', ...]
  
  // Performance metrics
  totalDeliveries: integer("total_deliveries").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  currentStatus: varchar("current_status", { length: 20 }).default("available"), // available, assigned, on_delivery, offline
  lastLocationUpdate: timestamp("last_location_update"),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_personnel_company_idx").on(table.companyId),
  index("delivery_personnel_vehicle_idx").on(table.vehicleId),
  index("delivery_personnel_phone_idx").on(table.phone),
  index("delivery_personnel_status_idx").on(table.currentStatus),
  index("delivery_personnel_license_idx").on(table.licenseNumber),
]);

// Delivery routes and assignments
export const deliveryRoutes = pgTable("delivery_routes", {
  id: serial("id").primaryKey(),
  routeName: text("route_name").notNull(),
  driverId: integer("driver_id").references(() => deliveryPersonnel.id),
  vehicleId: integer("vehicle_id").references(() => deliveryVehicles.id),
  
  // Route details
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location"),
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }), // km
  estimatedDuration: integer("estimated_duration"), // minutes
  
  // Route stops (orders to deliver)
  orderIds: integer("order_ids").array(),
  totalStops: integer("total_stops").default(0),
  completedStops: integer("completed_stops").default(0),
  
  // Status and timing
  status: varchar("status", { length: 20 }).default("planned"), // planned, in_progress, completed, cancelled
  plannedStartTime: timestamp("planned_start_time"),
  actualStartTime: timestamp("actual_start_time"),
  plannedEndTime: timestamp("planned_end_time"),
  actualEndTime: timestamp("actual_end_time"),
  
  // Performance metrics
  totalWeight: decimal("total_weight", { precision: 10, scale: 3 }),
  totalVolume: decimal("total_volume", { precision: 10, scale: 3 }),
  fuelConsumed: decimal("fuel_consumed", { precision: 8, scale: 2 }),
  actualDistance: decimal("actual_distance", { precision: 8, scale: 2 }),
  
  // GPS tracking
  routeGpsData: text("route_gps_data"), // JSON string of GPS coordinates
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_routes_driver_idx").on(table.driverId),
  index("delivery_routes_vehicle_idx").on(table.vehicleId),
  index("delivery_routes_status_idx").on(table.status),
  index("delivery_routes_date_idx").on(table.plannedStartTime),
]);

// Sequential delivery code counter (1111-9999)
export const deliveryCodeCounter = pgTable("delivery_code_counter", {
  id: serial("id").primaryKey(),
  currentCode: integer("current_code").notNull().default(1111),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// 4-digit delivery verification codes
export const deliveryVerificationCodes = pgTable("delivery_verification_codes", {
  id: serial("id").primaryKey(),
  customerOrderId: integer("customer_order_id").notNull().unique(),
  
  // Verification code
  verificationCode: varchar("verification_code", { length: 4 }).notNull(),
  
  // SMS details
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: text("customer_name").notNull(),
  smsMessage: text("sms_message"),
  smsSentAt: timestamp("sms_sent_at"),
  smsStatus: varchar("sms_status", { length: 20 }).default("pending"), // pending, sent, delivered, failed
  smsProvider: varchar("sms_provider", { length: 20 }),
  smsMessageId: text("sms_message_id"),
  
  // Verification details
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"), // Delivery person name
  verificationLocation: text("verification_location"),
  verificationLatitude: decimal("verification_latitude", { precision: 10, scale: 7 }),
  verificationLongitude: decimal("verification_longitude", { precision: 10, scale: 7 }),
  
  // Delivery attempt tracking
  deliveryAttempts: integer("delivery_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  failureReasons: text("failure_reasons").array(),
  
  // Expiry
  expiresAt: timestamp("expires_at").notNull(), // Code expires after 24-48 hours
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_verification_order_idx").on(table.customerOrderId),
  index("delivery_verification_code_idx").on(table.verificationCode),
  index("delivery_verification_phone_idx").on(table.customerPhone),
  index("delivery_verification_status_idx").on(table.smsStatus),
  index("delivery_verification_verified_idx").on(table.isVerified),
]);

// Logistics performance analytics
export const logisticsAnalytics = pgTable("logistics_analytics", {
  id: serial("id").primaryKey(),
  
  // Date and time period
  analyticsDate: timestamp("analytics_date").notNull(),
  period: varchar("period", { length: 10 }).notNull(), // daily, weekly, monthly
  
  // Delivery metrics
  totalOrders: integer("total_orders").default(0),
  deliveredOrders: integer("delivered_orders").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  averageDeliveryTime: decimal("average_delivery_time", { precision: 8, scale: 2 }), // hours
  
  // Route metrics
  totalRoutes: integer("total_routes").default(0),
  completedRoutes: integer("completed_routes").default(0),
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }),
  totalFuelConsumed: decimal("total_fuel_consumed", { precision: 10, scale: 2 }),
  
  // Performance metrics
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }),
  customerSatisfactionScore: decimal("customer_satisfaction_score", { precision: 3, scale: 2 }),
  averageDeliveryRating: decimal("average_delivery_rating", { precision: 3, scale: 2 }),
  
  // Cost metrics
  totalDeliveryCost: decimal("total_delivery_cost", { precision: 12, scale: 2 }),
  costPerDelivery: decimal("cost_per_delivery", { precision: 10, scale: 2 }),
  costPerKm: decimal("cost_per_km", { precision: 8, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("logistics_analytics_date_idx").on(table.analyticsDate),
  index("logistics_analytics_period_idx").on(table.period),
]);

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const insertTransportationCompanySchema = createInsertSchema(transportationCompanies);
export const insertDeliveryVehicleSchema = createInsertSchema(deliveryVehicles);
export const insertDeliveryPersonnelSchema = createInsertSchema(deliveryPersonnel);
export const insertDeliveryRouteSchema = createInsertSchema(deliveryRoutes);
export const insertDeliveryCodeCounterSchema = createInsertSchema(deliveryCodeCounter);
export const insertDeliveryVerificationCodeSchema = createInsertSchema(deliveryVerificationCodes);
export const insertLogisticsAnalyticsSchema = createInsertSchema(logisticsAnalytics);

// =============================================================================
// TYPES
// =============================================================================

export type TransportationCompany = typeof transportationCompanies.$inferSelect;
export type InsertTransportationCompany = z.infer<typeof insertTransportationCompanySchema>;

export type DeliveryVehicle = typeof deliveryVehicles.$inferSelect;
export type InsertDeliveryVehicle = z.infer<typeof insertDeliveryVehicleSchema>;

export type DeliveryPersonnel = typeof deliveryPersonnel.$inferSelect;
export type InsertDeliveryPersonnel = z.infer<typeof insertDeliveryPersonnelSchema>;

export type DeliveryRoute = typeof deliveryRoutes.$inferSelect;
export type InsertDeliveryRoute = z.infer<typeof insertDeliveryRouteSchema>;

export type DeliveryCodeCounter = typeof deliveryCodeCounter.$inferSelect;
export type InsertDeliveryCodeCounter = z.infer<typeof insertDeliveryCodeCounterSchema>;

export type DeliveryVerificationCode = typeof deliveryVerificationCodes.$inferSelect;
export type InsertDeliveryVerificationCode = z.infer<typeof insertDeliveryVerificationCodeSchema>;

export type LogisticsAnalytics = typeof logisticsAnalytics.$inferSelect;
export type InsertLogisticsAnalytics = z.infer<typeof insertLogisticsAnalyticsSchema>;

// =============================================================================
// CONSTANTS
// =============================================================================

export const VEHICLE_TYPES = {
  MOTORCYCLE: 'motorcycle',
  CAR: 'car', 
  TRUCK: 'truck',
  VAN: 'van'
} as const;

export const DELIVERY_STATUS = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed'
} as const;

export const ROUTE_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const SMS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
} as const;

export type VehicleType = typeof VEHICLE_TYPES[keyof typeof VEHICLE_TYPES];
export type DeliveryStatus = typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];
export type RouteStatus = typeof ROUTE_STATUS[keyof typeof ROUTE_STATUS];
export type SmsStatus = typeof SMS_STATUS[keyof typeof SMS_STATUS];

// =============================================================================
// IRAQI CITIES AND SHIPPING RATES MANAGEMENT
// =============================================================================

// Iraqi provinces table
export const iraqiProvinces = pgTable("iraqi_provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Province name
  nameArabic: text("name_arabic").notNull(), // Arabic name (محافظة بغداد)
  nameEnglish: text("name_english").notNull(), // English name (Baghdad Governorate)
  nameKurdish: text("name_kurdish"), // Kurdish name if applicable
  capital: text("capital").notNull(), // Capital city of the province
  region: text("region").notNull().default("center"), // north, south, center, kurdistan
  area: integer("area"), // Area in square kilometers
  population: integer("population"), // Population estimate
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("iraqi_provinces_name_idx").on(table.name),
  index("iraqi_provinces_region_idx").on(table.region),
  index("iraqi_provinces_active_idx").on(table.isActive),
]);

// Iraqi cities table for shipping and freight calculation
export const iraqiCities = pgTable("iraqi_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // City name
  nameArabic: text("name_arabic"), // Arabic name
  nameEnglish: text("name_english"), // English name
  nameKurdish: text("name_kurdish"), // Kurdish name if applicable
  provinceId: integer("province_id").notNull().references(() => iraqiProvinces.id), // Reference to province
  provinceName: text("province_name").notNull(), // Province name for easy access
  region: text("region").default("center"), // north, south, center, kurdistan
  postalCode: text("postal_code"), // Postal code if available
  distanceFromBaghdad: integer("distance_from_baghdad"), // Distance in KM from Baghdad
  distanceFromErbilKm: integer("distance_from_erbil_km").default(0), // Distance in KM from Erbil for logistics optimization
  distanceFromProvinceCapital: integer("distance_from_province_capital"), // Distance from province capital
  isProvinceCapital: boolean("is_province_capital").default(false), // Is it a province capital
  vehicleId: integer("vehicle_id").references(() => deliveryVehicles.id), // Assigned vehicle for this city
  hasIntercityBusLine: boolean("has_intercity_bus_line").default(false), // خط مسافربری بین شهری موجود است
  isActive: boolean("is_active").default(true),
  population: integer("population"), // Population estimate
  coordinates: text("coordinates"), // GPS coordinates if available
  elevation: integer("elevation"), // Elevation in meters
  economicActivity: text("economic_activity"), // Main economic activities
  notes: text("notes"), // Additional notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("iraqi_cities_name_idx").on(table.name),
  index("iraqi_cities_province_idx").on(table.provinceId),
  index("iraqi_cities_province_name_idx").on(table.provinceName),
  index("iraqi_cities_region_idx").on(table.region),
  index("iraqi_cities_active_idx").on(table.isActive),
  index("iraqi_cities_capital_idx").on(table.isProvinceCapital),
  index("iraqi_cities_vehicle_idx").on(table.vehicleId),
]);

// Shipping rates table for Iraqi cities
export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => iraqiCities.id),
  weightRange: text("weight_range").notNull(), // "0-1kg", "1-5kg", "5-10kg", etc.
  minWeight: decimal("min_weight", { precision: 8, scale: 2 }).default("0"), // Minimum weight in kg
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }), // Maximum weight in kg
  standardRate: decimal("standard_rate", { precision: 10, scale: 2 }).notNull(), // Standard shipping rate in IQD
  expressRate: decimal("express_rate", { precision: 10, scale: 2 }), // Express shipping rate in IQD
  overnightRate: decimal("overnight_rate", { precision: 10, scale: 2 }), // Overnight delivery rate in IQD
  deliveryDays: integer("delivery_days").default(3), // Standard delivery days
  expressDeliveryDays: integer("express_delivery_days").default(1), // Express delivery days
  currency: text("currency").default("IQD"),
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveUntil: timestamp("effective_until"), // Rate expiration date
  notes: text("notes"), // Special conditions or notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shipping_rates_city_idx").on(table.cityId),
  index("shipping_rates_weight_idx").on(table.weightRange),
  index("shipping_rates_active_idx").on(table.isActive),
]);

// Freight calculation table for bulk shipments
export const freightRates = pgTable("freight_rates", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => iraqiCities.id),
  transportType: text("transport_type").notNull(), // "truck", "van", "motorcycle", "plane"
  vehicleSize: text("vehicle_size"), // "small", "medium", "large", "extra_large"
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(), // Base rate in IQD
  perKgRate: decimal("per_kg_rate", { precision: 8, scale: 2 }), // Rate per kilogram
  perKmRate: decimal("per_km_rate", { precision: 8, scale: 2 }), // Rate per kilometer
  fuelSurcharge: decimal("fuel_surcharge", { precision: 5, scale: 2 }).default("0"), // Fuel surcharge percentage
  minimumCharge: decimal("minimum_charge", { precision: 10, scale: 2 }), // Minimum charge
  maximumWeight: decimal("maximum_weight", { precision: 10, scale: 2 }), // Maximum weight capacity
  deliveryTimeHours: integer("delivery_time_hours").default(72), // Estimated delivery time in hours
  isActive: boolean("is_active").default(true),
  currency: text("currency").default("IQD"),
  providerName: text("provider_name"), // Transportation company name
  contactInfo: text("contact_info"), // Contact information
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("freight_rates_city_idx").on(table.cityId),
  index("freight_rates_transport_idx").on(table.transportType),
  index("freight_rates_vehicle_idx").on(table.vehicleSize),
  index("freight_rates_active_idx").on(table.isActive),
]);

// Ready Vehicles Directory - Track available vehicles and drivers
export const readyVehicles = pgTable("ready_vehicles", {
  id: serial("id").primaryKey(),
  
  // Vehicle information
  vehicleType: text("vehicle_type").notNull(), // Type of vehicle (truck, van, motorcycle, etc.)
  licensePlate: varchar("license_plate", { length: 20 }).notNull().unique(), // Vehicle license plate
  
  // Driver information
  driverName: text("driver_name").notNull(), // Driver's full name
  driverMobile: varchar("driver_mobile", { length: 20 }).notNull(), // Driver's mobile number
  
  // Capacity and specifications
  loadCapacity: decimal("load_capacity", { precision: 8, scale: 2 }).notNull(), // Load capacity in kg
  
  // Current status and location
  isAvailable: boolean("is_available").default(true), // Is the vehicle available for work
  currentLocation: text("current_location"), // Current location of the vehicle
  
  // Additional information
  notes: text("notes"), // Additional notes about the vehicle or driver
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("ready_vehicles_available_idx").on(table.isAvailable),
  index("ready_vehicles_type_idx").on(table.vehicleType),
  index("ready_vehicles_plate_idx").on(table.licensePlate),
]);

// Add new schemas and types for Iraqi cities
export const insertIraqiProvinceSchema = createInsertSchema(iraqiProvinces);
export const insertIraqiCitySchema = createInsertSchema(iraqiCities);
export const insertShippingRateSchema = createInsertSchema(shippingRates);
export const insertFreightRateSchema = createInsertSchema(freightRates);
export const insertReadyVehicleSchema = createInsertSchema(readyVehicles);

export type IraqiProvince = typeof iraqiProvinces.$inferSelect;
export type InsertIraqiProvince = z.infer<typeof insertIraqiProvinceSchema>;
export type IraqiCity = typeof iraqiCities.$inferSelect;
export type InsertIraqiCity = z.infer<typeof insertIraqiCitySchema>;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;
export type FreightRate = typeof freightRates.$inferSelect;
export type InsertFreightRate = z.infer<typeof insertFreightRateSchema>;
export type ReadyVehicle = typeof readyVehicles.$inferSelect;
export type InsertReadyVehicle = z.infer<typeof insertReadyVehicleSchema>;



// Iraqi regions constants
export const IRAQI_REGIONS = {
  BAGHDAD: 'baghdad',
  NORTH: 'north',
  SOUTH: 'south',
  CENTER: 'center',
  KURDISTAN: 'kurdistan'
} as const;

export const TRANSPORT_TYPES = {
  MOTORCYCLE: 'motorcycle',
  VAN: 'van',
  TRUCK: 'truck',
  PLANE: 'plane'
} as const;

export const VEHICLE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium', 
  LARGE: 'large',
  EXTRA_LARGE: 'extra_large'
} as const;

export type IraqiRegion = typeof IRAQI_REGIONS[keyof typeof IRAQI_REGIONS];
export type TransportType = typeof TRANSPORT_TYPES[keyof typeof TRANSPORT_TYPES];
export type VehicleSize = typeof VEHICLE_SIZES[keyof typeof VEHICLE_SIZES];

// =============================================================================
// INTERNATIONAL GEOGRAPHY SYSTEM - Countries and Foreign Cities
// =============================================================================

// International Countries Table
export const internationalCountries = pgTable("international_countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Country name in Arabic
  nameEn: text("name_en").notNull(), // Country name in English
  nameLocal: text("name_local"), // Country name in local language
  countryCode: varchar("country_code", { length: 3 }).notNull().unique(), // ISO 3-letter code (TUR, IRN, SYR, etc.)
  region: text("region").notNull(), // Middle East, Asia, Europe, etc.
  currency: text("currency").notNull(), // TRY, IRR, USD, EUR, etc.
  isActive: boolean("is_active").default(true),
  hasShippingRoutes: boolean("has_shipping_routes").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("international_countries_code_idx").on(table.countryCode),
  index("international_countries_region_idx").on(table.region),
  index("international_countries_active_idx").on(table.isActive),
]);

// International Cities Table
export const internationalCities = pgTable("international_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // City name in Arabic
  nameEn: text("name_en").notNull(), // City name in English
  nameLocal: text("name_local"), // City name in local language
  countryId: integer("country_id").references(() => internationalCountries.id).notNull(),
  provinceState: text("province_state"), // Province/State within the country
  cityType: varchar("city_type", { length: 20 }).default("city"), // city, port, airport, border_crossing
  distanceFromErbilKm: decimal("distance_from_erbil_km", { precision: 8, scale: 2 }), // Distance from Erbil in kilometers
  isActive: boolean("is_active").default(true),
  hasShippingRoutes: boolean("has_shipping_routes").default(false),
  isPriorityDestination: boolean("is_priority_destination").default(false),
  customsInformation: text("customs_information"), // Customs and import/export notes
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("international_cities_country_idx").on(table.countryId),
  index("international_cities_type_idx").on(table.cityType),
  index("international_cities_active_idx").on(table.isActive),
  index("international_cities_distance_idx").on(table.distanceFromErbilKm),
]);

// International Shipping Rates Table
export const internationalShippingRates = pgTable("international_shipping_rates", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").references(() => internationalCountries.id),
  cityId: integer("city_id").references(() => internationalCities.id),
  shippingMethod: varchar("shipping_method", { length: 50 }).notNull(), // sea_freight, air_freight, land_transport
  transportProvider: text("transport_provider"), // Company providing the service
  
  // Pricing structure
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 8, scale: 2 }),
  pricePerKm: decimal("price_per_km", { precision: 8, scale: 2 }),
  minimumCharge: decimal("minimum_charge", { precision: 12, scale: 2 }),
  maximumWeight: decimal("maximum_weight", { precision: 10, scale: 2 }),
  
  // Time and conditions
  estimatedDaysMin: integer("estimated_days_min").default(7), // Minimum delivery time
  estimatedDaysMax: integer("estimated_days_max").default(14), // Maximum delivery time
  currency: text("currency").default("USD"), // Pricing currency
  
  // Restrictions and capabilities
  supportsHazardous: boolean("supports_hazardous").default(false),
  supportsFlammable: boolean("supports_flammable").default(false),
  supportsRefrigerated: boolean("supports_refrigerated").default(false),
  requiresCustomsClearance: boolean("requires_customs_clearance").default(true),
  
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("international_shipping_country_idx").on(table.countryId),
  index("international_shipping_city_idx").on(table.cityId),
  index("international_shipping_method_idx").on(table.shippingMethod),
  index("international_shipping_active_idx").on(table.isActive),
]);

// =============================================================================
// OPTIMAL VEHICLE SELECTION SYSTEM
// =============================================================================

// Vehicle Templates for optimal selection algorithm 
export const vehicleTemplates = pgTable("vehicle_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  vehicleType: varchar("vehicle_type", { length: 50 }).notNull(), // motorcycle, van, light_truck, heavy_truck
  
  // Capacity limits
  maxWeightKg: decimal("max_weight_kg", { precision: 8, scale: 2 }).notNull(),
  maxVolumeM3: decimal("max_volume_m3", { precision: 8, scale: 2 }),
  
  // Route restrictions
  allowedRoutes: text("allowed_routes").array().notNull(), // ['urban', 'interurban', 'highway']
  
  // Pricing structure
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerKm: decimal("price_per_km", { precision: 6, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 6, scale: 2 }).default("0"),
  
  // Special capabilities
  supportsHazardous: boolean("supports_hazardous").default(false),
  supportsFlammable: boolean("supports_flammable").default(false),
  supportsRefrigerated: boolean("supports_refrigerated").default(false),
  supportsFragile: boolean("supports_fragile").default(true),
  notAllowedFlammable: boolean("not_allowed_flammable").default(false),
  
  // Operational details
  averageSpeedKmh: decimal("average_speed_kmh", { precision: 5, scale: 2 }).default("50"),
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Lower number = higher priority
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("vehicle_templates_type_idx").on(table.vehicleType),
  index("vehicle_templates_active_idx").on(table.isActive),
  index("vehicle_templates_weight_idx").on(table.maxWeightKg),
]);

// Vehicle selection history and results
export const vehicleSelectionHistory = pgTable("vehicle_selection_history", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerId: integer("customer_id"),
  
  // Order requirements that were analyzed
  orderWeightKg: decimal("order_weight_kg", { precision: 8, scale: 2 }).notNull(),
  orderVolumeM3: decimal("order_volume_m3", { precision: 8, scale: 2 }),
  routeType: varchar("route_type", { length: 20 }).notNull(), // urban, interurban, highway
  distanceKm: decimal("distance_km", { precision: 8, scale: 2 }).notNull(),
  isHazardous: boolean("is_hazardous").default(false),
  isFlammable: boolean("is_flammable").default(false),
  isRefrigerated: boolean("is_refrigerated").default(false),
  isFragile: boolean("is_fragile").default(false),
  
  // Selected vehicle template
  selectedVehicleTemplateId: integer("selected_vehicle_template_id").references(() => vehicleTemplates.id),
  selectedVehicleName: text("selected_vehicle_name").notNull(),
  
  // Cost calculation results
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  weightCost: decimal("weight_cost", { precision: 10, scale: 2 }).default("0"),
  distanceCost: decimal("distance_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  
  // Alternative options that were considered
  alternativeOptions: json("alternative_options"), // Array of other vehicle options with costs
  
  // Selection metadata
  selectionAlgorithm: varchar("selection_algorithm", { length: 50 }).default("cost_optimization"),
  selectionCriteria: text("selection_criteria"), // Human readable explanation
  adminUserId: integer("admin_user_id"), // Who made the selection (if manual override)
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("vehicle_selection_order_idx").on(table.orderNumber),
  index("vehicle_selection_customer_idx").on(table.customerId),
  index("vehicle_selection_vehicle_idx").on(table.selectedVehicleTemplateId),
  index("vehicle_selection_date_idx").on(table.createdAt),
]);

// Route optimization and distance calculation cache
export const routeOptimization = pgTable("route_optimization", {
  id: serial("id").primaryKey(),
  
  // Route definition
  fromProvinceId: integer("from_province_id").references(() => iraqiProvinces.id),
  fromCityId: integer("from_city_id").references(() => iraqiCities.id),
  toProvinceId: integer("to_province_id").references(() => iraqiProvinces.id),
  toCityId: integer("to_city_id").references(() => iraqiCities.id),
  
  // Route details
  routeType: varchar("route_type", { length: 20 }).notNull(), // urban, interurban, highway
  distanceKm: decimal("distance_km", { precision: 8, scale: 2 }).notNull(),
  estimatedTimeMinutes: integer("estimated_time_minutes").notNull(),
  
  // Route characteristics
  hasHighway: boolean("has_highway").default(false),
  hasMountainRoad: boolean("has_mountain_road").default(false),
  hasUnpavedRoad: boolean("has_unpaved_road").default(false),
  tollCost: decimal("toll_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Traffic and conditions
  trafficMultiplier: decimal("traffic_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  weatherRestrictions: text("weather_restrictions").array(), // ['rain', 'snow', 'sandstorm']
  
  // Cache metadata
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  dataSource: varchar("data_source", { length: 50 }).default("manual"), // manual, google_maps, osm
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("route_optimization_from_idx").on(table.fromCityId),
  index("route_optimization_to_idx").on(table.toCityId),
  index("route_optimization_type_idx").on(table.routeType),
  index("route_optimization_distance_idx").on(table.distanceKm),
]);

// Insert schemas and types for vehicle optimization
export const insertVehicleTemplateSchema = createInsertSchema(vehicleTemplates);
export const insertVehicleSelectionHistorySchema = createInsertSchema(vehicleSelectionHistory);
export const insertRouteOptimizationSchema = createInsertSchema(routeOptimization);

export type VehicleTemplate = typeof vehicleTemplates.$inferSelect;
export type InsertVehicleTemplate = z.infer<typeof insertVehicleTemplateSchema>;
export type VehicleSelectionHistory = typeof vehicleSelectionHistory.$inferSelect;
export type InsertVehicleSelectionHistory = z.infer<typeof insertVehicleSelectionHistorySchema>;
export type RouteOptimization = typeof routeOptimization.$inferSelect;
export type InsertRouteOptimization = z.infer<typeof insertRouteOptimizationSchema>;

// Vehicle selection constants
export const ROUTE_TYPES = {
  URBAN: 'urban',
  INTERURBAN: 'interurban', 
  HIGHWAY: 'highway'
} as const;

export const OPTIMAL_VEHICLE_TYPES = {
  MOTORCYCLE: 'motorcycle',
  VAN: 'van',
  LIGHT_TRUCK: 'light_truck',
  HEAVY_TRUCK: 'heavy_truck'
} as const;

export const SELECTION_ALGORITHMS = {
  COST_OPTIMIZATION: 'cost_optimization',
  TIME_OPTIMIZATION: 'time_optimization',
  MIXED_OPTIMIZATION: 'mixed_optimization'
} as const;

export type RouteType = typeof ROUTE_TYPES[keyof typeof ROUTE_TYPES];
export type OptimalVehicleType = typeof OPTIMAL_VEHICLE_TYPES[keyof typeof OPTIMAL_VEHICLE_TYPES];
export type SelectionAlgorithm = typeof SELECTION_ALGORITHMS[keyof typeof SELECTION_ALGORITHMS];

// International geography schemas and types
export const insertInternationalCountrySchema = createInsertSchema(internationalCountries);
export const insertInternationalCitySchema = createInsertSchema(internationalCities);
export const insertInternationalShippingRateSchema = createInsertSchema(internationalShippingRates);

export type InternationalCountry = typeof internationalCountries.$inferSelect;
export type InsertInternationalCountry = z.infer<typeof insertInternationalCountrySchema>;
export type InternationalCity = typeof internationalCities.$inferSelect;
export type InsertInternationalCity = z.infer<typeof insertInternationalCitySchema>;
export type InternationalShippingRate = typeof internationalShippingRates.$inferSelect;
export type InsertInternationalShippingRate = z.infer<typeof insertInternationalShippingRateSchema>;

// International geography constants
export const INTERNATIONAL_CITY_TYPES = {
  CITY: 'city',
  PORT: 'port', 
  AIRPORT: 'airport',
  BORDER_CROSSING: 'border_crossing'
} as const;

export const INTERNATIONAL_SHIPPING_METHODS = {
  SEA_FREIGHT: 'sea_freight',
  AIR_FREIGHT: 'air_freight', 
  LAND_TRANSPORT: 'land_transport'
} as const;

export type InternationalCityType = typeof INTERNATIONAL_CITY_TYPES[keyof typeof INTERNATIONAL_CITY_TYPES];
export type InternationalShippingMethod = typeof INTERNATIONAL_SHIPPING_METHODS[keyof typeof INTERNATIONAL_SHIPPING_METHODS];