import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, User, Clock } from "lucide-react";

interface ChatLog {
  id: number;
  mobile: string;
  firstName: string;
  lastName: string;
  specialistName: string;
  messageContent: string;
  senderType: 'user' | 'specialist';
  createdAt: string;
}

export default function ChatLogs() {
  const { data: chats, isLoading } = useQuery({
    queryKey: ['/api/chat/all?limit=200'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupChatsByMobile = (chats: ChatLog[]) => {
    const grouped = chats.reduce((acc, chat) => {
      if (!acc[chat.mobile]) {
        acc[chat.mobile] = [];
      }
      acc[chat.mobile].push(chat);
      return acc;
    }, {} as Record<string, ChatLog[]>);

    // Sort conversations by latest message
    Object.keys(grouped).forEach(mobile => {
      grouped[mobile].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat logs...</p>
          </div>
        </div>
      </div>
    );
  }

  const chatData = (chats as any)?.success ? (chats as any).chats : [];
  const groupedChats = groupChatsByMobile(chatData);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Chat Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          All conversations between users and specialists (30-day retention)
        </p>
      </div>

      <div className="grid gap-6">
        {Object.keys(groupedChats).length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No chat logs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedChats).map(([mobile, conversations]) => {
            const latestMessage = conversations[0];
            const messageCount = conversations.length;
            
            return (
              <Card key={mobile} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-lg">{mobile}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {latestMessage.firstName} {latestMessage.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {messageCount} messages
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatDate(latestMessage.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversations.slice(0, 5).map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg ${
                        chat.senderType === 'user'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                          : 'bg-green-50 dark:bg-green-900/20 border-l-2 border-l-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={chat.senderType === 'user' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {chat.senderType === 'user' ? 'User' : chat.specialistName}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(chat.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {chat.messageContent}
                      </p>
                    </div>
                  ))}
                  {conversations.length > 5 && (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-xs">
                        +{conversations.length - 5} more messages
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}