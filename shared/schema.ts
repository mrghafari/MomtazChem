import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// MAIN CRM & ADMIN SYSTEM SCHEMA
// =============================================================================

// Import showcase and shop schemas
export * from "./showcase-schema";
export * from "./shop-schema";

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin, manager, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Leads table for CRM system
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  country: text("country"),
  city: text("city"),
  leadSource: text("lead_source").notNull(), // contact_form, website, email, phone, referral
  status: text("status").notNull().default("new"), // new, contacted, qualified, proposal, negotiation, closed_won, closed_lost
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  productInterest: text("product_interest"), // Which product category they're interested in
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  probability: integer("probability").default(25), // Percentage chance of closing
  expectedCloseDate: timestamp("expected_close_date"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
  assignedTo: integer("assigned_to"), // User ID of assigned sales rep
  tags: json("tags"), // Array of tags for categorization
  customFields: json("custom_fields"), // Additional custom data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead activities table for tracking interactions
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  activityType: text("activity_type").notNull(), // call, email, meeting, note, status_change
  subject: text("subject").notNull(),
  description: text("description"),
  contactMethod: text("contact_method"), // phone, email, in_person, video_call
  outcome: text("outcome"), // positive, negative, neutral, no_response
  duration: integer("duration"), // Duration in minutes
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by"), // User ID who created the activity
  attachments: json("attachments"), // Array of file paths/URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
