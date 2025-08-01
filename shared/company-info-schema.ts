import { pgTable, serial, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Company basic information
export const companyInformation = pgTable("company_information", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }),
  companyNameEnglish: varchar("company_name_english", { length: 255 }),
  companyNameArabic: varchar("company_name_arabic", { length: 255 }),
  companyNameKurdish: varchar("company_name_kurdish", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 255 }),
  email: varchar("email", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  salesEmail: varchar("sales_email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  supportPhone: varchar("support_phone", { length: 50 }),
  salesPhone: varchar("sales_phone", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  address: text("address"),
  addressEnglish: text("address_english"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  taxId: varchar("tax_id", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  establishedYear: integer("established_year"),
  description: text("description"),
  descriptionEnglish: text("description_english"),
  mission: text("mission"),
  vision: text("vision"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incoming correspondence (نامه های وارده)
export const incomingCorrespondence = pgTable("incoming_correspondence", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderOrganization: varchar("sender_organization", { length: 255 }),
  senderEmail: varchar("sender_email", { length: 255 }),
  senderPhone: varchar("sender_phone", { length: 50 }),
  dateReceived: timestamp("date_received").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"), // high, medium, low
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, archived
  category: varchar("category", { length: 100 }), // inquiry, complaint, request, etc.
  content: text("content"),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  assignedTo: integer("assigned_to"), // admin user ID
  responseRequired: boolean("response_required").default(true),
  responseDeadline: timestamp("response_deadline"),
  notes: text("notes"),
  tags: text("tags"), // comma-separated tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Outgoing correspondence (نامه های صادره)
export const outgoingCorrespondence = pgTable("outgoing_correspondence", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  recipientOrganization: varchar("recipient_organization", { length: 255 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 50 }),
  dateSent: timestamp("date_sent").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, sent, delivered, acknowledged
  category: varchar("category", { length: 100 }),
  content: text("content"),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  createdBy: integer("created_by"), // admin user ID
  approvedBy: integer("approved_by"), // admin user ID
  inResponseTo: integer("in_response_to"), // references incoming_correspondence ID
  deliveryMethod: varchar("delivery_method", { length: 50 }).default("email"), // email, post, fax, hand-delivery
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company documents and certificates
export const companyDocuments = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(), // license, certificate, contract, policy
  documentNumber: varchar("document_number", { length: 100 }),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  issuingAuthority: varchar("issuing_authority", { length: 255 }),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, expired, renewed, cancelled
  description: text("description"),
  tags: text("tags"),
  uploadedBy: integer("uploaded_by"), // admin user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Cards table
export const businessCards = pgTable("business_cards", {
  id: serial("id").primaryKey(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  employeeNameArabic: varchar("employee_name_arabic", { length: 255 }),
  employeeNameKurdish: varchar("employee_name_kurdish", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobTitleArabic: varchar("job_title_arabic", { length: 255 }),
  jobTitleKurdish: varchar("job_title_kurdish", { length: 255 }),
  department: varchar("department", { length: 255 }),
  directPhone: varchar("direct_phone", { length: 50 }),
  mobilePhone: varchar("mobile_phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  officeLocation: varchar("office_location", { length: 255 }),
  linkedinProfile: varchar("linkedin_profile", { length: 500 }),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  cardDesign: varchar("card_design", { length: 100 }).default("standard"), // standard, executive, creative
  cardColor: varchar("card_color", { length: 50 }).default("corporate"), // corporate, blue, green, etc.
  includeQrCode: boolean("include_qr_code").default(false),
  qrCodeData: text("qr_code_data"), // vCard data or contact info
  specialNotes: text("special_notes"),
  isActive: boolean("is_active").default(true),
  printQuantity: integer("print_quantity").default(500),
  lastPrintDate: timestamp("last_print_date"),
  cardStatus: varchar("card_status", { length: 50 }).default("draft"), // draft, approved, printed, distributed
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Images table
export const companyImages = pgTable("company_images", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // logo, building, products, team, certificates, equipment, gallery, other
  tags: text("tags"), // comma-separated tags
  isActive: boolean("is_active").default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: integer("uploaded_by"), // admin user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas
export const insertCompanyInformationSchema = createInsertSchema(companyInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncomingCorrespondenceSchema = createInsertSchema(incomingCorrespondence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOutgoingCorrespondenceSchema = createInsertSchema(outgoingCorrespondence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessCardSchema = createInsertSchema(businessCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertCompanyImageSchema = createInsertSchema(companyImages).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type CompanyInformation = typeof companyInformation.$inferSelect;
export type InsertCompanyInformation = z.infer<typeof insertCompanyInformationSchema>;

export type IncomingCorrespondence = typeof incomingCorrespondence.$inferSelect;
export type InsertIncomingCorrespondence = z.infer<typeof insertIncomingCorrespondenceSchema>;

export type OutgoingCorrespondence = typeof outgoingCorrespondence.$inferSelect;
export type InsertOutgoingCorrespondence = z.infer<typeof insertOutgoingCorrespondenceSchema>;

export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;

export type BusinessCard = typeof businessCards.$inferSelect;
export type InsertBusinessCard = z.infer<typeof insertBusinessCardSchema>;

export type CompanyImage = typeof companyImages.$inferSelect;
export type InsertCompanyImage = z.infer<typeof insertCompanyImageSchema>;