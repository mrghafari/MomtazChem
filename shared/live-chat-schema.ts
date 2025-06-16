import { pgTable, text, serial, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// جلسه‌های چت زنده - برای مشتریان لاگین شده و غیر لاگین
export const liveChatSessions = pgTable("live_chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  
  // اطلاعات مشتری
  customerName: text("customer_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  
  // ارتباط با CRM (در صورت وجود)
  crmCustomerId: integer("crm_customer_id"),
  isLoggedIn: boolean("is_logged_in").default(false),
  
  // وضعیت جلسه
  status: text("status").notNull().default("waiting"), // waiting, active, completed, abandoned
  assignedSpecialistId: text("assigned_specialist_id"),
  
  // زمان‌ها
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  
  // آمار جلسه
  messageCount: integer("message_count").default(0),
  waitingTime: integer("waiting_time"), // زمان انتظار در ثانیه
  responseTime: integer("response_time"), // میانگین زمان پاسخ
  
  // ارزیابی مشتری
  customerRating: integer("customer_rating"), // 1-5
  customerFeedback: text("customer_feedback"),
  
  // متادیتا
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrerUrl: text("referrer_url"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// پیام‌های چت زنده
export const liveChatMessages = pgTable("live_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => liveChatSessions.sessionId),
  
  // فرستنده
  sender: text("sender").notNull(), // customer, specialist, system
  senderName: text("sender_name"),
  
  // محتوای پیام
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, form_data, system_notification
  
  // وضعیت پیام
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  // ضمائم
  attachments: json("attachments").$type<string[]>().default([]),
  
  // متادیتای پیام
  metadata: json("metadata").$type<{
    formData?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    };
    systemEvent?: string;
    specialistId?: string;
  }>(),
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// فرم اطلاعات مشتری برای کاربران غیر لاگین
export const guestCustomerForms = pgTable("guest_customer_forms", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  
  // اطلاعات فرم
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  
  // وضعیت فرم
  isCompleted: boolean("is_completed").default(false),
  isVerified: boolean("is_verified").default(false),
  
  // متادیتا
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  
  // ارتباط با CRM
  crmCustomerId: integer("crm_customer_id"),
  syncedToCrm: boolean("synced_to_crm").default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// وضعیت آنلاین متخصصان
export const specialistOnlineStatus = pgTable("specialist_online_status", {
  id: serial("id").primaryKey(),
  specialistId: text("specialist_id").notNull().unique(),
  
  // وضعیت
  status: text("status").notNull().default("offline"), // online, busy, away, offline
  isAvailable: boolean("is_available").default(false),
  
  // آمار
  activeChatSessions: integer("active_chat_sessions").default(0),
  maxConcurrentChats: integer("max_concurrent_chats").default(3),
  
  // آخرین فعالیت
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  lastStatusChange: timestamp("last_status_change").notNull().defaultNow(),
  
  // اطلاعات جلسه
  currentSessionIds: json("current_session_ids").$type<string[]>().default([]),
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ایجاد اسکیماهای insert
export const insertLiveChatSessionSchema = createInsertSchema(liveChatSessions).omit({
  id: true,
  startedAt: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveChatMessageSchema = createInsertSchema(liveChatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertGuestCustomerFormSchema = createInsertSchema(guestCustomerForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpecialistOnlineStatusSchema = createInsertSchema(specialistOnlineStatus).omit({
  id: true,
  lastSeenAt: true,
  lastStatusChange: true,
  updatedAt: true,
});

// تایپ‌ها
export type InsertLiveChatSession = z.infer<typeof insertLiveChatSessionSchema>;
export type LiveChatSession = typeof liveChatSessions.$inferSelect;

export type InsertLiveChatMessage = z.infer<typeof insertLiveChatMessageSchema>;
export type LiveChatMessage = typeof liveChatMessages.$inferSelect;

export type InsertGuestCustomerForm = z.infer<typeof insertGuestCustomerFormSchema>;
export type GuestCustomerForm = typeof guestCustomerForms.$inferSelect;

export type InsertSpecialistOnlineStatus = z.infer<typeof insertSpecialistOnlineStatusSchema>;
export type SpecialistOnlineStatus = typeof specialistOnlineStatus.$inferSelect;