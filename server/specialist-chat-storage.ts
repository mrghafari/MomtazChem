// Simplified in-memory storage for specialist chat sessions
interface ChatSession {
  id: string;
  sessionId: string;
  specialistId: string;
  customerPhone: string;
  customerName: string;
  status: string;
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
  messageCount: number;
  isSpecialistTyping: boolean;
  isCustomerTyping: boolean;
  customerRating?: number;
  sessionNotes?: string;
  specialistName?: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "specialist" | "customer";
  message: string;
  messageType: string;
  isRead: boolean;
  timestamp: Date;
}

export interface ISpecialistChatStorage {
  // Session management
  createChatSession(sessionData: {
    specialistId: string;
    customerPhone: string;
    customerName: string;
  }): Promise<ChatSession>;
  
  getActiveSessionForSpecialist(specialistId: string): Promise<ChatSession | undefined>;
  getActiveSessionByPhone(customerPhone: string): Promise<ChatSession | undefined>;
  getSessionById(sessionId: string): Promise<ChatSession | undefined>;
  
  // Session status management
  endChatSession(sessionId: string, notes?: string, rating?: number): Promise<ChatSession>;
  updateSessionActivity(sessionId: string): Promise<void>;
  
  // Message management
  addMessage(messageData: {
    sessionId: string;
    sender: "specialist" | "customer";
    message: string;
    messageType?: string;
  }): Promise<ChatMessage>;
  
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
  
  // Admin overview
  getAllActiveSessions(): Promise<ChatSession[]>;
}

export class SpecialistChatStorage implements ISpecialistChatStorage {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();

  async createChatSession(sessionData: {
    specialistId: string;
    customerPhone: string;
    customerName: string;
  }): Promise<ChatSession> {
    // Check if specialist already has an active session
    const existingSession = await this.getActiveSessionForSpecialist(sessionData.specialistId);
    if (existingSession) {
      throw new Error("Specialist already has an active chat session");
    }

    // Check if customer already has an active session
    const customerSession = await this.getActiveSessionByPhone(sessionData.customerPhone);
    if (customerSession) {
      throw new Error("Customer already has an active chat session");
    }

    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ChatSession = {
      id: sessionId,
      sessionId,
      specialistId: sessionData.specialistId,
      customerPhone: sessionData.customerPhone,
      customerName: sessionData.customerName,
      status: "active",
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      isSpecialistTyping: false,
      isCustomerTyping: false,
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    return session;
  }

  async getActiveSessionForSpecialist(specialistId: string): Promise<ChatSession | undefined> {
    for (const session of Array.from(this.sessions.values())) {
      if (session.specialistId === specialistId && session.status === "active") {
        return session;
      }
    }
    return undefined;
  }

  async getActiveSessionByPhone(customerPhone: string): Promise<ChatSession | undefined> {
    for (const session of Array.from(this.sessions.values())) {
      if (session.customerPhone === customerPhone && session.status === "active") {
        return session;
      }
    }
    return undefined;
  }

  async getSessionById(sessionId: string): Promise<ChatSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async endChatSession(sessionId: string, notes?: string, rating?: number): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = "completed";
    session.endedAt = new Date();
    if (notes) session.sessionNotes = notes;
    if (rating) session.customerRating = rating;

    this.sessions.set(sessionId, session);
    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastMessageAt = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async addMessage(messageData: {
    sessionId: string;
    sender: "specialist" | "customer";
    message: string;
    messageType?: string;
  }): Promise<ChatMessage> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: ChatMessage = {
      id: messageId,
      sessionId: messageData.sessionId,
      sender: messageData.sender,
      message: messageData.message,
      messageType: messageData.messageType || "text",
      isRead: false,
      timestamp: new Date(),
    };

    const sessionMessages = this.messages.get(messageData.sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(messageData.sessionId, sessionMessages);

    // Update session activity
    await this.updateSessionActivity(messageData.sessionId);
    
    // Update message count
    const session = this.sessions.get(messageData.sessionId);
    if (session) {
      session.messageCount = sessionMessages.length;
      this.sessions.set(messageData.sessionId, session);
    }

    return message;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messages.get(sessionId) || [];
  }

  async getAllActiveSessions(): Promise<ChatSession[]> {
    const activeSessions: ChatSession[] = [];
    for (const session of Array.from(this.sessions.values())) {
      if (session.status === "active") {
        activeSessions.push(session);
      }
    }
    return activeSessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }
}

export const specialistChatStorage = new SpecialistChatStorage();