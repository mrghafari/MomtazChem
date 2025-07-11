import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ticket Categories
export const ticketCategories = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  nameKu: varchar("name_ku", { length: 100 }),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => ticketCategories.id),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 20 }).default("open"), // open, in_progress, resolved, closed
  reporterEmail: varchar("reporter_email", { length: 100 }).notNull(),
  reporterName: varchar("reporter_name", { length: 100 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 100 }),
  attachments: jsonb("attachments").default("[]"), // Array of file URLs and names
  tags: jsonb("tags").default("[]"), // Array of tags
  estimatedTime: integer("estimated_time"), // in hours
  actualTime: integer("actual_time"), // in hours
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
});

// Ticket Comments/Responses
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  authorEmail: varchar("author_email", { length: 100 }).notNull(),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false), // Internal admin notes
  attachments: jsonb("attachments").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Watchers (who gets notified)
export const ticketWatchers = pgTable("ticket_watchers", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  watcherEmail: varchar("watcher_email", { length: 100 }).notNull(),
  watcherName: varchar("watcher_name", { length: 100 }),
  notifyOnUpdate: boolean("notify_on_update").default(true),
  notifyOnComment: boolean("notify_on_comment").default(true),
  notifyOnStatusChange: boolean("notify_on_status_change").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Settings
export const ticketSettings = pgTable("ticket_settings", {
  id: serial("id").primaryKey(),
  adminNotificationEmail: varchar("admin_notification_email", { length: 100 }),
  autoAssignToAdmin: boolean("auto_assign_to_admin").default(true),
  allowFileUploads: boolean("allow_file_uploads").default(true),
  maxFileSize: integer("max_file_size").default(10), // MB
  allowedFileTypes: jsonb("allowed_file_types").default('["jpg","jpeg","png","pdf","doc","docx"]'),
  ticketPrefix: varchar("ticket_prefix", { length: 10 }).default("TKT"),
  enableEmailNotifications: boolean("enable_email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = typeof ticketCategories.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = typeof ticketComments.$inferInsert;

export type TicketWatcher = typeof ticketWatchers.$inferSelect;
export type InsertTicketWatcher = typeof ticketWatchers.$inferInsert;

export type TicketSettings = typeof ticketSettings.$inferSelect;
export type InsertTicketSettings = typeof ticketSettings.$inferInsert;

// Validation Schemas
export const insertTicketCategorySchema = createInsertSchema(ticketCategories);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertTicketCommentSchema = createInsertSchema(ticketComments);
export const insertTicketWatcherSchema = createInsertSchema(ticketWatchers);
export const insertTicketSettingsSchema = createInsertSchema(ticketSettings);