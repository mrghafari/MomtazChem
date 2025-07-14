import { pgTable, text, serial, timestamp, decimal, boolean, integer, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// GPS DELIVERY TRACKING SCHEMA
// =============================================================================

// GPS delivery confirmations - track exact location when delivery verification codes are confirmed
export const gpsDeliveryConfirmations = pgTable("gps_delivery_confirmations", {
  id: serial("id").primaryKey(),
  deliveryVerificationId: integer("delivery_verification_id"),
  customerOrderId: integer("customer_order_id").notNull(),
  
  // GPS Location Data  
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(), // GPS coordinate
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(), // GPS coordinate
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // GPS accuracy in meters
  
  // Delivery Person Information
  deliveryPersonName: text("delivery_person_name").notNull(),
  deliveryPersonPhone: text("delivery_person_phone").notNull(),
  
  // Location Analysis
  addressMatched: boolean("address_matched").default(false),
  customerAddress: text("customer_address"),
  detectedAddress: text("detected_address"), 
  distanceFromCustomer: decimal("distance_from_customer", { precision: 8, scale: 2 }),
  
  // Geographic Information
  country: text("country"),
  city: text("city"),
  region: text("region"),
  
  // Verification Details
  verificationTime: timestamp("verification_time").notNull().defaultNow(),
  
  // Notes
  deliveryNotes: text("delivery_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("gps_delivery_verification_idx").on(table.deliveryVerificationId),
  index("gps_delivery_order_idx").on(table.customerOrderId),
  index("gps_delivery_location_idx").on(table.latitude, table.longitude),
  index("gps_delivery_time_idx").on(table.verificationTime),
  index("gps_delivery_person_idx").on(table.deliveryPersonPhone),
  index("gps_delivery_address_idx").on(table.city, table.region),
]);

// GPS delivery analytics - aggregated data for analytics
export const gpsDeliveryAnalytics = pgTable("gps_delivery_analytics", {
  id: serial("id").primaryKey(),
  
  // Date and Geographic Grouping
  analysisDate: timestamp("analysis_date").notNull(), // Date for this analytics record
  country: text("country").notNull(),
  city: text("city").notNull(),
  region: text("region"),
  
  // Delivery Statistics
  totalDeliveries: integer("total_deliveries").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  addressMatchedDeliveries: integer("address_matched_deliveries").default(0),
  averageAccuracy: decimal("average_accuracy", { precision: 8, scale: 2 }),
  averageDistanceFromCustomer: decimal("average_distance_from_customer", { precision: 10, scale: 2 }),
  
  // Geographic Coverage
  coverageAreaKm2: decimal("coverage_area_km2", { precision: 12, scale: 4 }), // Coverage area in km²
  uniqueNeighborhoods: integer("unique_neighborhoods").default(0),
  northeastLat: decimal("northeast_lat", { precision: 10, scale: 8 }),
  northeastLng: decimal("northeast_lng", { precision: 11, scale: 8 }),
  southwestLat: decimal("southwest_lat", { precision: 10, scale: 8 }),
  southwestLng: decimal("southwest_lng", { precision: 11, scale: 8 }),
  
  // Performance Metrics
  averageDeliveryTimeMinutes: integer("average_delivery_time_minutes"),
  deliverySuccessRate: decimal("delivery_success_rate", { precision: 5, scale: 2 }), // Percentage
  customerSatisfactionRate: decimal("customer_satisfaction_rate", { precision: 5, scale: 2 }),
  
  // Delivery Person Performance
  uniqueDeliveryPersons: integer("unique_delivery_persons").default(0),
  averageDeliveriesPerPerson: decimal("average_deliveries_per_person", { precision: 8, scale: 2 }),
  
  // Issues and Problems
  totalIssuesReported: integer("total_issues_reported").default(0),
  commonIssueTypes: text("common_issue_types"), // JSON array of common issues
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("gps_analytics_date_idx").on(table.analysisDate),
  index("gps_analytics_location_idx").on(table.country, table.city),
  index("gps_analytics_performance_idx").on(table.deliverySuccessRate),
]);

// Zod schemas for validation
export const insertGpsDeliveryConfirmationSchema = createInsertSchema(gpsDeliveryConfirmations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGpsDeliveryAnalyticsSchema = createInsertSchema(gpsDeliveryAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type GpsDeliveryConfirmation = typeof gpsDeliveryConfirmations.$inferSelect;
export type InsertGpsDeliveryConfirmation = z.infer<typeof insertGpsDeliveryConfirmationSchema>;
export type GpsDeliveryAnalytics = typeof gpsDeliveryAnalytics.$inferSelect;
export type InsertGpsDeliveryAnalytics = z.infer<typeof insertGpsDeliveryAnalyticsSchema>;

// Geographic zones for analysis
export const deliveryZones = {
  IRAQ_CENTRAL: { name: 'Iraq Central', countries: ['Iraq'], cities: ['Baghdad', 'Karbala', 'Najaf'] },
  IRAQ_NORTH: { name: 'Iraq North', countries: ['Iraq'], cities: ['Erbil', 'Kirkuk', 'Sulaymaniyah'] },
  IRAQ_SOUTH: { name: 'Iraq South', countries: ['Iraq'], cities: ['Basra', 'Nasiriyah', 'Diwaniyah'] },
  IRAN_WEST: { name: 'Iran West', countries: ['Iran'], cities: ['Tehran', 'تویسرکان', 'Kermanshah'] },
  TURKEY_SOUTHEAST: { name: 'Turkey Southeast', countries: ['Turkey'], cities: ['Diyarbakır', 'Mardin', 'Şanlıurfa'] },
} as const;

// Delivery performance metrics
export const deliveryMetrics = {
  EXCELLENT: { minAccuracy: 0, maxAccuracy: 10, minSuccessRate: 95 },
  GOOD: { minAccuracy: 10, maxAccuracy: 50, minSuccessRate: 85 },
  FAIR: { minAccuracy: 50, maxAccuracy: 100, minSuccessRate: 75 },
  POOR: { minAccuracy: 100, maxAccuracy: 999999, minSuccessRate: 0 },
} as const;