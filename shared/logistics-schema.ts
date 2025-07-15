import { pgTable, text, serial, timestamp, decimal, boolean, integer, varchar, index } from "drizzle-orm/pg-core";
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