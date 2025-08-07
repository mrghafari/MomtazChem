import { useState, useEffect, useCallback } from "react";
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Users, Settings, PhoneCall, Mic, MicOff, VideoOff, Phone, PhoneOff, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JitsiConfig {
  startWithAudioMuted: boolean;
  startWithVideoMuted: boolean;
  disableChat: boolean;
  enableWelcomePage: boolean;
  prejoinPageEnabled: boolean;
  resolution: number;
}

interface JitsiMeetingRoom {
  id: string;
  name: string;
  roomName: string;
  description?: string;
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  password?: string;
  createdAt: string;
}

export default function JitsiMeetPage() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>("");
  const [userName, setUserName] = useState("کاربر مهمان");
  const [customRoomName, setCustomRoomName] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [jitsiConfig, setJitsiConfig] = useState<JitsiConfig>({
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    disableChat: false,
    enableWelcomePage: false,
    prejoinPageEnabled: true,
    resolution: 720
  });
  const [api, setApi] = useState<any>(null);
  const { toast } = useToast();

  // Predefined rooms for quick access
  const quickRooms = [
    { id: 'general', name: 'اتاق عمومی', description: 'برای گفتگوهای عمومی' },
    { id: 'sales', name: 'اتاق فروش', description: 'مشاوره فروش و خدمات' },
    { id: 'support', name: 'پشتیبانی فنی', description: 'راهنمایی و پشتیبانی' },
    { id: 'management', name: 'اتاق مدیریت', description: 'جلسات مدیریتی' }
  ];

  const handleJoinRoom = useCallback((roomName: string) => {
    const finalRoomName = roomName || customRoomName;
    if (!finalRoomName.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام اتاق را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setCurrentRoom(finalRoomName.replace(/\s+/g, '-').toLowerCase());
    setIsInMeeting(true);
    
    toast({
      title: "درحال ورود",
      description: `ورود به اتاق ${finalRoomName}...`,
    });
  }, [customRoomName, toast]);

  const handleLeaveMeeting = useCallback(() => {
    if (api) {
      api.dispose();
      setApi(null);
    }
    setIsInMeeting(false);
    setCurrentRoom("");
    
    toast({
      title: "جلسه پایان یافت",
      description: "با موفقیت از جلسه خارج شدید",
    });
  }, [api, toast]);

  const handleApiReady = useCallback((externalApi: any) => {
    setApi(externalApi);
    
    // Event listeners
    externalApi.addEventListener('videoConferenceJoined', () => {
      console.log('✅ User joined Jitsi meeting');
      toast({
        title: "متصل شدید",
        description: "با موفقیت وارد جلسه شدید",
      });
    });

    externalApi.addEventListener('videoConferenceLeft', () => {
      console.log('👋 User left Jitsi meeting');
      handleLeaveMeeting();
    });

    externalApi.addEventListener('participantJoined', (participant: any) => {
      console.log('👤 Participant joined:', participant);
    });

    externalApi.addEventListener('participantLeft', (participant: any) => {
      console.log('👋 Participant left:', participant);
    });

    // Set user display name
    if (userName) {
      externalApi.executeCommand('displayName', userName);
    }
  }, [userName, toast, handleLeaveMeeting]);

  if (isInMeeting && currentRoom) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-4">
          {/* Meeting Header */}
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎥 جلسه ویدئویی - {currentRoom}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                کاربر: {userName}
              </p>
            </div>
            <Button 
              onClick={handleLeaveMeeting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              پایان جلسه
            </Button>
          </div>

          {/* Jitsi Meeting Container */}
          <Card className="w-full">
            <CardContent className="p-0">
              <div className="w-full h-[600px] rounded-lg overflow-hidden">
                <JitsiMeeting
                  domain="meet.jit.si"
                  roomName={currentRoom}
                  configOverwrite={{
                    startWithAudioMuted: jitsiConfig.startWithAudioMuted,
                    startWithVideoMuted: jitsiConfig.startWithVideoMuted,
                    disableChat: jitsiConfig.disableChat,
                    enableWelcomePage: jitsiConfig.enableWelcomePage,
                    prejoinPageEnabled: jitsiConfig.prejoinPageEnabled,
                    disableSimulcast: false,
                    enableNoAudioDetection: true,
                    enableNoisyMicDetection: true,
                    resolution: jitsiConfig.resolution,
                    constraints: {
                      video: {
                        height: {
                          ideal: jitsiConfig.resolution,
                          max: 1080,
                          min: 240
                        }
                      }
                    }
                  }}
                  interfaceConfigOverwrite={{
                    TOOLBAR_BUTTONS: [
                      'microphone', 
                      'camera', 
                      'hangup', 
                      'chat', 
                      'desktop',
                      'fullscreen',
                      'fodeviceselection',
                      'raisehand',
                      'stats',
                      'settings'
                    ],
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    TILE_VIEW_MAX_COLUMNS: 4,
                    MOBILE_APP_PROMO: false,
                    SHOW_CHROME_EXTENSION_BANNER: false
                  }}
                  userInfo={{
                    displayName: userName,
                    email: "" // Optional field
                  }}
                  onApiReady={handleApiReady}
                  getIFrameRef={(iframeRef) => {
                    if (iframeRef) {
                      iframeRef.style.height = '600px';
                      iframeRef.style.width = '100%';
                      iframeRef.style.border = 'none';
                      iframeRef.style.borderRadius = '8px';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎥 Jitsi Meet - ویدیو کنفرانس
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            سیستم پیشرفته ویدیو کنفرانس با کیفیت بالا
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Room Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  تنظیمات کاربر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userName">نام نمایشی</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="نام خود را وارد کنید"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Access Rooms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5" />
                  اتاق‌های آماده
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickRooms.map((room) => (
                    <Card key={room.id} className="border-2 hover:border-blue-500 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {room.name}
                          </h3>
                          <Badge variant="secondary">آماده</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {room.description}
                        </p>
                        <Button 
                          onClick={() => handleJoinRoom(room.id)}
                          className="w-full"
                          size="sm"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          ورود به اتاق
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Room */}
            <Card>
              <CardHeader>
                <CardTitle>ایجاد اتاق سفارشی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customRoom">نام اتاق</Label>
                  <Input
                    id="customRoom"
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    placeholder="نام اتاق مورد نظر خود را وارد کنید"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={() => handleJoinRoom(customRoomName)}
                  className="w-full"
                  disabled={!customRoomName.trim()}
                >
                  <Video className="w-4 h-4 mr-2" />
                  ایجاد و ورود
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Settings */}
          <div className="space-y-6">
            {/* Meeting Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  تنظیمات جلسه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audioMuted">شروع با میکروفون خاموش</Label>
                  <Switch
                    id="audioMuted"
                    checked={jitsiConfig.startWithAudioMuted}
                    onCheckedChange={(checked) => 
                      setJitsiConfig(prev => ({ ...prev, startWithAudioMuted: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="videoMuted">شروع با دوربین خاموش</Label>
                  <Switch
                    id="videoMuted"
                    checked={jitsiConfig.startWithVideoMuted}
                    onCheckedChange={(checked) => 
                      setJitsiConfig(prev => ({ ...prev, startWithVideoMuted: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="disableChat">غیرفعال کردن چت</Label>
                  <Switch
                    id="disableChat"
                    checked={jitsiConfig.disableChat}
                    onCheckedChange={(checked) => 
                      setJitsiConfig(prev => ({ ...prev, disableChat: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="prejoin">صفحه آماده‌سازی</Label>
                  <Switch
                    id="prejoin"
                    checked={jitsiConfig.prejoinPageEnabled}
                    onCheckedChange={(checked) => 
                      setJitsiConfig(prev => ({ ...prev, prejoinPageEnabled: checked }))
                    }
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="resolution">کیفیت ویدیو</Label>
                  <select
                    id="resolution"
                    value={jitsiConfig.resolution}
                    onChange={(e) => 
                      setJitsiConfig(prev => ({ ...prev, resolution: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    <option value={480}>480p - استاندارد</option>
                    <option value={720}>720p - HD</option>
                    <option value={1080}>1080p - Full HD</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>امکانات Jitsi Meet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-green-600" />
                    <span>ویدیو کنفرانس HD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-green-600" />
                    <span>صدای با کیفیت</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span>چت متنی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span>تا ۷۵ نفر همزمان</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    <span>اشتراک‌گذاری صفحه</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}