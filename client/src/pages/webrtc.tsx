import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Phone, PhoneOff, MessageCircle, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  description?: string;
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export default function WebRTC() {
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [userName, setUserName] = useState("کاربر مهمان");
  const [userId] = useState(`user_${Date.now()}`);
  const [chatMessage, setChatMessage] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    localStream,
    remoteStreams,
    participants,
    messages,
    isConnected,
    currentRoom,
    isMuted,
    hasVideo,
    isScreenSharing,
    localVideoRef,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage
  } = useWebRTC();

  // Fetch rooms
  const { data: roomsResponse, isLoading } = useQuery<{data: Room[]}>({
    queryKey: ["/api/webrtc/rooms"],
    refetchInterval: 5000 // Update every 5 seconds
  });
  
  const rooms = roomsResponse?.data || [];

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; description?: string; maxParticipants: number; createdBy: string }) => {
      return await apiRequest("/api/webrtc/rooms", {
        method: "POST",
        body: JSON.stringify(roomData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webrtc/rooms"] });
      setNewRoomName("");
      setNewRoomDescription("");
      setShowCreateRoom(false);
      toast({
        title: "اتاق ایجاد شد",
        description: "اتاق جدید با موفقیت ایجاد شد",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد اتاق",
        variant: "destructive"
      });
    }
  });

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: "خطا",
        description: "نام اتاق الزامی است",
        variant: "destructive"
      });
      return;
    }

    createRoomMutation.mutate({
      name: newRoomName,
      description: newRoomDescription,
      maxParticipants: 10,
      createdBy: userId
    });
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId, userName, userId);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">سیستم ویدیو کنفرانس</h1>
          <p className="text-gray-600">سیستم WebRTC برای ارتباط صوتی و تصویری</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "متصل" : "قطع اتصال"}
            </Badge>
            {currentRoom && (
              <Badge variant="outline">
                اتاق: {currentRoom}
              </Badge>
            )}
          </div>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اطلاعات کاربر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="نام کاربری"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rooms List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>اتاق‌ها</CardTitle>
                  <Button
                    onClick={() => setShowCreateRoom(!showCreateRoom)}
                    size="sm"
                  >
                    اتاق جدید
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Create Room Form */}
                {showCreateRoom && (
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <Input
                        placeholder="نام اتاق"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                      />
                      <Input
                        placeholder="توضیحات (اختیاری)"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateRoom}
                          disabled={createRoomMutation.isPending}
                          className="flex-1"
                        >
                          ایجاد
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateRoom(false)}
                          className="flex-1"
                        >
                          لغو
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rooms List */}
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="text-center py-4">در حال بارگذاری...</div>
                  ) : (
                    <div className="space-y-2">
                      {rooms.map((room: Room) => (
                        <div
                          key={room.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{room.name}</h4>
                            <Badge variant="secondary">
                              {room.participantCount}/{room.maxParticipants}
                            </Badge>
                          </div>
                          {room.description && (
                            <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                          )}
                          <Button
                            onClick={() => handleJoinRoom(room.id)}
                            disabled={!!currentRoom || room.participantCount >= room.maxParticipants}
                            size="sm"
                            className="w-full"
                          >
                            {room.participantCount >= room.maxParticipants ? "پر" : "پیوستن"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Video Area */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>ویدیو کنفرانس</CardTitle>
                  {currentRoom && (
                    <Button
                      onClick={handleLeaveRoom}
                      variant="destructive"
                      size="sm"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      خروج از اتاق
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentRoom ? (
                  <div className="space-y-4">
                    {/* Local Video */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        شما ({userName})
                      </div>
                    </div>

                    {/* Remote Videos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
                        const participant = participants.find(p => p.socketId === socketId);
                        return (
                          <div key={socketId} className="relative bg-gray-900 rounded-lg overflow-hidden">
                            <video
                              autoPlay
                              playsInline
                              className="w-full h-48 object-cover"
                              ref={(video) => {
                                if (video && stream) {
                                  video.srcObject = stream;
                                }
                              }}
                            />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                              {participant?.userName || 'کاربر ناشناس'}
                              {participant?.isMuted && <MicOff className="inline h-3 w-3 ml-1" />}
                              {!participant?.hasVideo && <VideoOff className="inline h-3 w-3 ml-1" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={toggleAudio}
                        variant={isMuted ? "destructive" : "default"}
                        size="sm"
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={toggleVideo}
                        variant={!hasVideo ? "destructive" : "default"}
                        size="sm"
                      >
                        {hasVideo ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        variant={isScreenSharing ? "secondary" : "outline"}
                        size="sm"
                      >
                        {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Participants */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">شرکت‌کنندگان ({participants.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((participant) => (
                          <Badge key={participant.socketId} variant="outline">
                            {participant.userName}
                            {participant.isHost && " (میزبان)"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>برای شروع، به یکی از اتاق‌ها بپیوندید</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            {currentRoom && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    چت
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      {messages.map((message) => (
                        <div key={message.id} className="mb-2">
                          <div className="text-xs text-gray-500">
                            {message.userName} - {new Date(message.createdAt).toLocaleTimeString('fa-IR')}
                          </div>
                          <div className={`text-sm ${message.messageType === 'system' ? 'italic text-gray-600' : ''}`}>
                            {message.message}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        placeholder="پیام خود را بنویسید..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage}>
                        ارسال
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}