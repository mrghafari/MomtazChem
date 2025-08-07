import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { db } from "./db";
import { webrtcRooms, roomParticipants, chatMessages } from "@shared/webrtc-schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

export function setupWebRTCSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  // Store room information in memory for fast access
  const rooms = new Map<string, Set<string>>();
  const socketToRoom = new Map<string, string>();
  const socketToUser = new Map<string, { userId: string; userName: string }>();

  io.on("connection", (socket: any) => {
    console.log(`🔌 [WebRTC] User connected: ${socket.id}`);

    // Join room
    socket.on("join-room", async (data: { roomId: string; userName: string; userId: string }) => {
      try {
        const { roomId, userName, userId } = data;
        
        // Check if room exists
        const [room] = await db.select().from(webrtcRooms).where(eq(webrtcRooms.id, roomId));
        if (!room || !room.isActive) {
          socket.emit("error", { message: "Room not found or inactive" });
          return;
        }

        // Check room capacity
        const currentParticipants = await db.select().from(roomParticipants)
          .where(and(eq(roomParticipants.roomId, roomId), isNull(roomParticipants.leftAt)));
        
        if (currentParticipants.length >= (room.maxParticipants || 10)) {
          socket.emit("error", { message: "Room is full" });
          return;
        }

        // Join the socket room
        socket.join(roomId);
        
        // Store socket information
        socketToRoom.set(socket.id, roomId);
        socketToUser.set(socket.id, { userId, userName });
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)?.add(socket.id);

        // Add participant to database
        const participantId = nanoid();
        await db.insert(roomParticipants).values({
          id: participantId,
          roomId,
          userId,
          userName,
          socketId: socket.id,
          isHost: currentParticipants.length === 0, // First person is host
        });

        // Get all participants in room
        const participants = await db.select().from(roomParticipants)
          .where(and(eq(roomParticipants.roomId, roomId), isNull(roomParticipants.leftAt)));

        // Notify others in room
        socket.to(roomId).emit("user-joined", {
          socketId: socket.id,
          userId,
          userName,
          participants: participants.length
        });

        // Send room info to joining user
        socket.emit("room-joined", {
          roomId,
          participants: participants.map(p => ({
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            isHost: p.isHost,
            isMuted: p.isMuted,
            hasVideo: p.hasVideo,
            isScreenSharing: p.isScreenSharing
          }))
        });

        // Send system message
        const systemMessage = {
          id: nanoid(),
          roomId,
          userId: "system",
          userName: "System",
          message: `${userName} joined the room`,
          messageType: "system",
          createdAt: new Date()
        };

        await db.insert(chatMessages).values(systemMessage);
        io.to(roomId).emit("chat-message", systemMessage);

        console.log(`✅ [WebRTC] User ${userName} joined room ${roomId}`);
      } catch (error) {
        console.error("❌ [WebRTC] Join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // WebRTC signaling
    socket.on("offer", (data: { roomId: string; offer: RTCSessionDescriptionInit; to: string }) => {
      socket.to(data.to).emit("offer", {
        offer: data.offer,
        from: socket.id
      });
    });

    socket.on("answer", (data: { roomId: string; answer: RTCSessionDescriptionInit; to: string }) => {
      socket.to(data.to).emit("answer", {
        answer: data.answer,
        from: socket.id
      });
    });

    socket.on("ice-candidate", (data: { roomId: string; candidate: RTCIceCandidateInit; to: string }) => {
      socket.to(data.to).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id
      });
    });

    // Chat messages
    socket.on("chat-message", async (data: { roomId: string; message: string }) => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) return;

        const messageData = {
          id: nanoid(),
          roomId: data.roomId,
          userId: userInfo.userId,
          userName: userInfo.userName,
          message: data.message,
          messageType: "text",
          createdAt: new Date()
        };

        await db.insert(chatMessages).values(messageData);
        io.to(data.roomId).emit("chat-message", messageData);
      } catch (error) {
        console.error("❌ [WebRTC] Chat message error:", error);
      }
    });

    // Audio/Video controls
    socket.on("toggle-audio", async (data: { roomId: string; isMuted: boolean }) => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) return;

        await db.update(roomParticipants)
          .set({ isMuted: data.isMuted })
          .where(and(
            eq(roomParticipants.socketId, socket.id),
            eq(roomParticipants.roomId, data.roomId)
          ));

        socket.to(data.roomId).emit("user-audio-toggle", {
          socketId: socket.id,
          userId: userInfo.userId,
          isMuted: data.isMuted
        });
      } catch (error) {
        console.error("❌ [WebRTC] Toggle audio error:", error);
      }
    });

    socket.on("toggle-video", async (data: { roomId: string; hasVideo: boolean }) => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) return;

        await db.update(roomParticipants)
          .set({ hasVideo: data.hasVideo })
          .where(and(
            eq(roomParticipants.socketId, socket.id),
            eq(roomParticipants.roomId, data.roomId)
          ));

        socket.to(data.roomId).emit("user-video-toggle", {
          socketId: socket.id,
          userId: userInfo.userId,
          hasVideo: data.hasVideo
        });
      } catch (error) {
        console.error("❌ [WebRTC] Toggle video error:", error);
      }
    });

    // Screen sharing
    socket.on("start-screen-share", async (data: { roomId: string }) => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) return;

        await db.update(roomParticipants)
          .set({ isScreenSharing: true })
          .where(and(
            eq(roomParticipants.socketId, socket.id),
            eq(roomParticipants.roomId, data.roomId)
          ));

        socket.to(data.roomId).emit("user-screen-share-start", {
          socketId: socket.id,
          userId: userInfo.userId
        });
      } catch (error) {
        console.error("❌ [WebRTC] Start screen share error:", error);
      }
    });

    socket.on("stop-screen-share", async (data: { roomId: string }) => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) return;

        await db.update(roomParticipants)
          .set({ isScreenSharing: false })
          .where(and(
            eq(roomParticipants.socketId, socket.id),
            eq(roomParticipants.roomId, data.roomId)
          ));

        socket.to(data.roomId).emit("user-screen-share-stop", {
          socketId: socket.id,
          userId: userInfo.userId
        });
      } catch (error) {
        console.error("❌ [WebRTC] Stop screen share error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const userInfo = socketToUser.get(socket.id);

        if (roomId && userInfo) {
          // Update participant as left
          await db.update(roomParticipants)
            .set({ leftAt: new Date() })
            .where(and(
              eq(roomParticipants.socketId, socket.id),
              eq(roomParticipants.roomId, roomId)
            ));

          // Remove from memory
          rooms.get(roomId)?.delete(socket.id);
          if (rooms.get(roomId)?.size === 0) {
            rooms.delete(roomId);
          }

          // Notify others
          socket.to(roomId).emit("user-left", {
            socketId: socket.id,
            userId: userInfo.userId,
            userName: userInfo.userName
          });

          // Send system message
          const systemMessage = {
            id: nanoid(),
            roomId,
            userId: "system",
            userName: "System", 
            message: `${userInfo.userName} left the room`,
            messageType: "system",
            createdAt: new Date()
          };

          await db.insert(chatMessages).values(systemMessage);
          socket.to(roomId).emit("chat-message", systemMessage);

          console.log(`❌ [WebRTC] User ${userInfo.userName} left room ${roomId}`);
        }

        socketToRoom.delete(socket.id);
        socketToUser.delete(socket.id);
      } catch (error) {
        console.error("❌ [WebRTC] Disconnect error:", error);
      }
    });
  });

  console.log("🎥 [WebRTC] Socket server initialized");
  return io;
}