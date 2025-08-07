import { Router } from "express";
import { db } from "./db";
import { webrtcRooms, roomParticipants, chatMessages } from "@shared/webrtc-schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const router = Router();

// Create a new room
router.post("/rooms", async (req, res) => {
  try {
    const { name, description, maxParticipants, createdBy } = req.body;
    
    const roomId = nanoid();
    const room = {
      id: roomId,
      name,
      description,
      createdBy,
      maxParticipants: maxParticipants || 10,
      isActive: true,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(webrtcRooms).values(room);
    
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Create room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create room"
    });
  }
});

// Get all active rooms
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await db.select().from(webrtcRooms)
      .where(eq(webrtcRooms.isActive, true))
      .orderBy(desc(webrtcRooms.createdAt));

    // Get participant counts for each room
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await db.select().from(roomParticipants)
          .where(and(
            eq(roomParticipants.roomId, room.id),
            isNull(roomParticipants.leftAt)
          ));
        
        return {
          ...room,
          participantCount: participants.length
        };
      })
    );

    res.json({
      success: true,
      data: roomsWithCounts
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Get rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rooms"
    });
  }
});

// Get room details
router.get("/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const [room] = await db.select().from(webrtcRooms)
      .where(eq(webrtcRooms.id, roomId));

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Get current participants
    const participants = await db.select().from(roomParticipants)
      .where(and(
        eq(roomParticipants.roomId, roomId),
        isNull(roomParticipants.leftAt)
      ));

    // Get recent chat messages
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: {
        room,
        participants,
        messages: messages.reverse() // Show oldest first
      }
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Get room details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get room details"
    });
  }
});

// Update room
router.put("/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, maxParticipants, isActive } = req.body;

    await db.update(webrtcRooms)
      .set({
        name,
        description,
        maxParticipants,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(webrtcRooms.id, roomId));

    res.json({
      success: true,
      message: "Room updated successfully"
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Update room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update room"
    });
  }
});

// Delete room
router.delete("/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Soft delete - mark as inactive
    await db.update(webrtcRooms)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(webrtcRooms.id, roomId));

    res.json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Delete room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room"
    });
  }
});

// Get chat history for a room
router.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error("❌ [WebRTC API] Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages"
    });
  }
});

export default router;