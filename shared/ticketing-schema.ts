import { pgTable, text, serial, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// TICKETING SYSTEM SCHEMA FOR SITE MANAGERS
// =============================================================================

// Support tickets table - for site managers to report technical issues to admin
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(), // Format: TKT-2025-001
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // technical_issue, feature_request, bug_report, system_error, user_access, other
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent, critical
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed, on_hold
  department: text("department"), // which department the issue relates to
  assignedTo: integer("assigned_to"), // admin user ID who is handling the ticket
  submittedBy: integer("submitted_by").notNull(), // site manager user ID who submitted the ticket
  customerUserId: text("customer_user_id"), // custom user ID for role-based access
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  submitterDepartment: text("submitter_department"),
  attachments: json("attachments"), // Array of uploaded file URLs/paths
  tags: json("tags"), // Array of tags for categorization
  estimatedResolution: timestamp("estimated_resolution"), // when admin expects to resolve
  actualResolution: timestamp("actual_resolution"), // when it was actually resolved
  resolutionNotes: text("resolution_notes"), // admin notes on how it was resolved
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 rating from submitter
  internalNotes: text("internal_notes"), // private admin notes not visible to submitter
  isUrgent: boolean("is_urgent").default(false), // flag for urgent tickets
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
});

// Ticket responses/comments table
export const ticketResponses = pgTable("ticket_responses", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  senderId: integer("sender_id").notNull(), // user ID (admin or site manager)
  senderName: text("sender_name").notNull(),
  senderType: text("sender_type").notNull(), // admin, site_manager
  message: text("message").notNull(),
  attachments: json("attachments"), // Array of file URLs
  isInternal: boolean("is_internal").default(false), // internal admin notes not visible to submitter
  isSystemMessage: boolean("is_system_message").default(false), // automated system messages
  readAt: timestamp("read_at"), // when the other party read the message
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ticket status history table - tracks all status changes
export const ticketStatusHistory = pgTable("ticket_status_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").notNull(), // user ID who made the change
  changedByName: text("changed_by_name").notNull(),
  changedByType: text("changed_by_type").notNull(), // admin, site_manager
  reason: text("reason"), // optional reason for status change
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ticket categories for organization
export const ticketCategories = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6B7280"), // hex color for UI
  icon: text("icon").default("HelpCircle"), // Lucide icon name
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ticket assignments for admin workload management
export const ticketAssignments = pgTable("ticket_assignments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  assignedTo: integer("assigned_to").notNull(), // admin user ID
  assignedBy: integer("assigned_by").notNull(), // admin user ID who made the assignment
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  notes: text("notes"), // assignment notes
});

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
});

export const insertTicketResponseSchema = createInsertSchema(ticketResponses).omit({
  id: true,
  createdAt: true,
});

export const insertTicketStatusHistorySchema = createInsertSchema(ticketStatusHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCategorySchema = createInsertSchema(ticketCategories).omit({
  id: true,
  createdAt: true,
});

export const insertTicketAssignmentSchema = createInsertSchema(ticketAssignments).omit({
  id: true,
  assignedAt: true,
});

// =============================================================================
// TYPESCRIPT TYPES
// =============================================================================

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type TicketResponse = typeof ticketResponses.$inferSelect;
export type InsertTicketResponse = z.infer<typeof insertTicketResponseSchema>;

export type TicketStatusHistory = typeof ticketStatusHistory.$inferSelect;
export type InsertTicketStatusHistory = z.infer<typeof insertTicketStatusHistorySchema>;

export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = z.infer<typeof insertTicketCategorySchema>;

export type TicketAssignment = typeof ticketAssignments.$inferSelect;
export type InsertTicketAssignment = z.infer<typeof insertTicketAssignmentSchema>;

// =============================================================================
// UTILITY TYPES AND ENUMS
// =============================================================================

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent', 'critical'] as const;
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'on_hold'] as const;
export const TICKET_CATEGORIES = [
  'technical_issue',
  'feature_request', 
  'bug_report',
  'system_error',
  'user_access',
  'performance_issue',
  'security_concern',
  'data_issue',
  'integration_problem',
  'other'
] as const;

export type TicketPriority = typeof TICKET_PRIORITIES[number];
export type TicketStatus = typeof TICKET_STATUSES[number];
export type TicketCategoryType = typeof TICKET_CATEGORIES[number];