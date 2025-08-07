import { pgTable, varchar, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// WebRTC Rooms table
export const webrtcRooms = pgTable("webrtc_rooms", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  maxParticipants: integer("max_participants").default(10),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Room Participants table
export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey(),
  roomId: varchar("room_id").references(() => webrtcRooms.id).notNull(),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name").notNull(),
  socketId: varchar("socket_id"),
  isHost: boolean("is_host").default(false),
  isMuted: boolean("is_muted").default(false),
  hasVideo: boolean("has_video").default(true),
  isScreenSharing: boolean("is_screen_sharing").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey(),
  roomId: varchar("room_id").references(() => webrtcRooms.id).notNull(),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name").notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, file, system
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertWebrtcRoomSchema = createInsertSchema(webrtcRooms);
export const selectWebrtcRoomSchema = createSelectSchema(webrtcRooms);

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants);
export const selectRoomParticipantSchema = createSelectSchema(roomParticipants);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);

// Types
export type WebrtcRoom = typeof webrtcRooms.$inferSelect;
export type InsertWebrtcRoom = typeof webrtcRooms.$inferInsert;

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = typeof roomParticipants.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// WebRTC Events
export interface WebRTCEvents {
  "join-room": { roomId: string; userName: string; userId: string };
  "leave-room": { roomId: string; userId: string };
  "offer": { roomId: string; offer: RTCSessionDescriptionInit; to: string };
  "answer": { roomId: string; answer: RTCSessionDescriptionInit; to: string };
  "ice-candidate": { roomId: string; candidate: RTCIceCandidateInit; to: string };
  "chat-message": { roomId: string; message: string; userId: string; userName: string };
  "toggle-audio": { roomId: string; userId: string; isMuted: boolean };
  "toggle-video": { roomId: string; userId: string; hasVideo: boolean };
  "start-screen-share": { roomId: string; userId: string };
  "stop-screen-share": { roomId: string; userId: string };
}