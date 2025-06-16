import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Phone, 
  User, 
  Clock, 
  Send, 
  X, 
  Star,
  CheckCircle,
  AlertCircle,
  UserX
} from "lucide-react";

interface SpecialistChatSession {
  id: number;
  sessionId: string;
  specialistId: string;
  customerPhone: string;
  customerName: string;
  status: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  isSpecialistTyping: boolean;
  isCustomerTyping: boolean;
  specialistName?: string;
}

interface ChatMessage {
  id: number;
  sessionId: string;
  sender: "specialist" | "customer";
  message: string;
  messageType: string;
  isRead: boolean;
  timestamp: Date;
}

export default function SpecialistChat() {
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("");
  const [activeSession, setActiveSession] = useState<SpecialistChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [customerRating, setCustomerRating] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch specialists
  const { data: specialists = [] } = useQuery({
    queryKey: ["/api/admin/specialists"],
  });

  // Fetch active sessions for all specialists
  const { data: activeSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/specialist-chat/active-sessions"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch messages for active session
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ["/api/specialist-chat/messages", activeSession?.sessionId],
    enabled: !!activeSession?.sessionId,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Update messages when sessionMessages changes
  useEffect(() => {
    if (Array.isArray(sessionMessages)) {
      setMessages(sessionMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, [sessionMessages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 10);
    return () => clearTimeout(timer);
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { sessionId: string; message: string }) => {
      return await apiRequest("/api/specialist-chat/send-message", "POST", {
        ...messageData,
        sender: "specialist"
      });
    },
    onSuccess: () => {
      setCurrentMessage("");
      queryClient.invalidateQueries({
        queryKey: ["/api/specialist-chat/messages", activeSession?.sessionId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/specialist-chat/active-sessions"]
      });
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: string; notes?: string; rating?: number }) => {
      return await apiRequest("/api/specialist-chat/end-session", "POST", data);
    },
    onSuccess: () => {
      setActiveSession(null);
      setMessages([]);
      setShowEndSessionDialog(false);
      setSessionNotes("");
      setCustomerRating(0);
      queryClient.invalidateQueries({
        queryKey: ["/api/specialist-chat/active-sessions"]
      });
      toast({
        title: "Session Ended",
        description: "Chat session has been completed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle sending message
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !activeSession) return;

    sendMessageMutation.mutate({
      sessionId: activeSession.sessionId,
      message: currentMessage.trim()
    });
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle session selection
  const handleSessionSelect = (session: SpecialistChatSession) => {
    setActiveSession(session);
    setMessages([]);
  };

  // Handle ending session
  const handleEndSession = () => {
    if (!activeSession) return;

    endSessionMutation.mutate({
      sessionId: activeSession.sessionId,
      notes: sessionNotes || undefined,
      rating: customerRating || undefined
    });
  };

  // Filter sessions by specialist
  const getSpecialistSessions = () => {
    if (!selectedSpecialist) return Array.isArray(activeSessions) ? activeSessions : [];
    return Array.isArray(activeSessions) ? activeSessions.filter((session: SpecialistChatSession) => 
      session.specialistId === selectedSpecialist
    ) : [];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Specialist Chat Management</h1>
        <p className="text-gray-600 mt-2">Manage individual chat sessions for each specialist</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Specialists & Sessions Sidebar */}
        <div className="col-span-4 space-y-4 overflow-hidden flex flex-col">
          {/* Specialist Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filter by Specialist</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedSpecialist}
                onChange={(e) => setSelectedSpecialist(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Specialists</option>
                {Array.isArray(specialists) && specialists.map((specialist: any) => (
                  <option key={specialist.id} value={specialist.id}>
                    {specialist.name} - {specialist.department}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Active Chat Sessions ({getSpecialistSessions().length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {isLoadingSessions ? (
                    <div className="text-center py-4">Loading sessions...</div>
                  ) : getSpecialistSessions().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No active chat sessions</p>
                    </div>
                  ) : (
                    getSpecialistSessions().map((session: SpecialistChatSession) => (
                      <div
                        key={session.sessionId}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          activeSession?.sessionId === session.sessionId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSessionSelect(session)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm">{session.customerName}</span>
                          </div>
                          <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{session.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>{session.specialistName || 'Unknown Specialist'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Started: {formatTime(new Date(session.startedAt))}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Duration: {formatDuration(new Date(session.startedAt))}</span>
                            <span>{session.messageCount} messages</span>
                          </div>
                        </div>

                        {session.isSpecialistTyping && (
                          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            Specialist typing...
                          </div>
                        )}
                        
                        {session.isCustomerTyping && (
                          <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            Customer typing...
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="col-span-8 flex flex-col overflow-hidden">
          {activeSession ? (
            <>
              {/* Chat Header */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{activeSession.customerName}</h3>
                        <p className="text-sm text-gray-600">{activeSession.customerPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(new Date(activeSession.startedAt))}
                      </Badge>
                      <Badge variant="outline">
                        {activeSession.messageCount} messages
                      </Badge>
                      <Dialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <X className="w-4 h-4 mr-1" />
                            End Session
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>End Chat Session</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Session Notes (Optional)</label>
                              <Textarea
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                placeholder="Add any notes about this session..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Customer Rating (Optional)</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => setCustomerRating(rating)}
                                    className={`p-1 ${customerRating >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                  >
                                    <Star className="w-5 h-5 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleEndSession}
                                disabled={endSessionMutation.isPending}
                                className="flex-1"
                              >
                                {endSessionMutation.isPending ? "Ending..." : "End Session"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowEndSessionDialog(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div ref={messagesContainerRef} className="h-full overflow-y-auto p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'specialist' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === 'specialist'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'specialist' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                              {message.sender === 'specialist' && (
                                <span className="ml-2">
                                  {message.isRead ? (
                                    <CheckCircle className="w-3 h-3 inline" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 inline" />
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Input */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={sendMessageMutation.isPending}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Chat Session Selected</h3>
                <p className="text-gray-500">Select an active chat session from the sidebar to start messaging</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}