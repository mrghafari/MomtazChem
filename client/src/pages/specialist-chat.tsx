import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Send, Clock, User, Phone, MessageCircle, CheckCircle } from "lucide-react";

interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  status: 'active' | 'waiting' | 'resolved';
  specialistId?: string;
  createdAt: string;
  lastMessageAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: 'website' | 'whatsapp' | 'telegram';
}

interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  senderType: 'customer' | 'specialist';
  senderName: string;
  timestamp: string;
  isRead: boolean;
}

interface Specialist {
  id: string;
  name: string;
  status: 'online' | 'offline';
  department: string;
}

export default function SpecialistChatPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [currentSpecialist, setCurrentSpecialist] = useState<Specialist | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current specialist info
  const { data: specialistInfo } = useQuery({
    queryKey: ['/api/specialist/me'],
  });

  // Get active chat sessions
  const { data: chatSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/specialist-chat/sessions'],
  });

  // Get messages for selected session
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/specialist-chat/messages', selectedSession],
    enabled: !!selectedSession,
  });

  useEffect(() => {
    if (specialistInfo) {
      setCurrentSpecialist(specialistInfo);
    }
  }, [specialistInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchSessions();
      if (selectedSession) {
        refetchMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSession, refetchSessions, refetchMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      const response = await fetch('/api/specialist-chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      refetchSessions();
      toast({
        title: "پیام ارسال شد",
        description: "پیام شما با موفقیت ارسال شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive",
      });
    },
  });

  const assignSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/specialist-chat/assign/${sessionId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchSessions();
      toast({
        title: "موفق",
        description: "چت به شما اختصاص یافت",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در اختصاص چت",
        variant: "destructive",
      });
    },
  });

  const resolveSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/specialist-chat/resolve/${sessionId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSelectedSession(null);
      refetchSessions();
      toast({
        title: "موفق",
        description: "چت بسته شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بستن چت",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedSession) return;
    
    sendMessageMutation.mutate({
      sessionId: selectedSession,
      message: messageText.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChannelBadge = (channel: string) => {
    const channelMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      website: { label: "وب‌سایت", variant: "default" },
      whatsapp: { label: "واتساپ", variant: "secondary" },
      telegram: { label: "تلگرام", variant: "outline" }
    };
    
    const config = channelMap[channel] || { label: channel, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-gray-500",
      normal: "text-blue-500", 
      high: "text-orange-500",
      urgent: "text-red-500"
    };
    return colors[priority] || "text-gray-500";
  };

  const sessionsList = Array.isArray(chatSessions) ? chatSessions : [];
  const messagesList = Array.isArray(messages) ? messages : [];

  const activeSessions = sessionsList.filter((s: ChatSession) => s.status === 'active');
  const waitingSessions = sessionsList.filter((s: ChatSession) => s.status === 'waiting');
  const resolvedSessions = sessionsList.filter((s: ChatSession) => s.status === 'resolved');

  return (
    <div className="h-screen flex">
      {/* Sessions List */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">چت‌های پشتیبانی</h2>
          {currentSpecialist && (
            <p className="text-sm text-gray-600 mt-1">
              {currentSpecialist.name} - {currentSpecialist.department}
            </p>
          )}
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">فعال ({activeSessions.length})</TabsTrigger>
            <TabsTrigger value="waiting">انتظار ({waitingSessions.length})</TabsTrigger>
            <TabsTrigger value="resolved">بسته ({resolvedSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              {activeSessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  className={`p-3 border-b cursor-pointer hover:bg-white transition-colors ${
                    selectedSession === session.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{session.customerName}</span>
                        {getChannelBadge(session.channel)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{session.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className={`w-3 h-3 ${getPriorityColor(session.priority)}`} />
                        <span className="text-xs text-gray-500">
                          {new Date(session.lastMessageAt).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeSessions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  هیچ چت فعالی وجود ندارد
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="waiting" className="mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              {waitingSessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  className="p-3 border-b hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{session.customerName}</span>
                        {getChannelBadge(session.channel)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{session.customerPhone}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => assignSessionMutation.mutate(session.id)}
                      >
                        پذیرش چت
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {waitingSessions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  هیچ چت در انتظاری وجود ندارد
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolved" className="mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              {resolvedSessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  className="p-3 border-b bg-gray-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm text-gray-600">{session.customerName}</span>
                    {getChannelBadge(session.channel)}
                  </div>
                  <div className="text-xs text-gray-500">
                    بسته شده در {new Date(session.lastMessageAt).toLocaleString('fa-IR')}
                  </div>
                </div>
              ))}
              
              {resolvedSessions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  هیچ چت بسته‌ای وجود ندارد
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium">
                      {activeSessions.find((s: ChatSession) => s.id === selectedSession)?.customerName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeSessions.find((s: ChatSession) => s.id === selectedSession)?.customerPhone}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveSessionMutation.mutate(selectedSession)}
                >
                  بستن چت
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesList.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'specialist' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === 'specialist'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderType === 'specialist' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">چت انتخاب کنید</h3>
              <p className="text-gray-400">برای شروع مکالمه، یک چت از لیست انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}