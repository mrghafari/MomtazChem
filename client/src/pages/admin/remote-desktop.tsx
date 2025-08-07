import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Users, 
  Settings, 
  Download, 
  Eye, 
  Shield, 
  Globe,
  Smartphone,
  Laptop,
  Server,
  Key,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface RemoteUser {
  id: string;
  name: string;
  email: string;
  country: string;
  os: string;
  status: 'online' | 'offline' | 'connecting';
  lastSeen: string;
  accessCode?: string;
  isConnected: boolean;
}

const RemoteDesktop: React.FC = () => {
  const [users, setUsers] = useState<RemoteUser[]>([
    {
      id: '1',
      name: 'Ahmad Hassan',
      email: 'ahmad@customer.com',
      country: 'Iraq',
      os: 'Windows 11',
      status: 'online',
      lastSeen: '2 minutes ago',
      accessCode: '748-293-561',
      isConnected: false
    },
    {
      id: '2', 
      name: 'Fatima Al-Zahra',
      email: 'fatima@supplier.com',
      country: 'Turkey',
      os: 'Windows 10',
      status: 'offline',
      lastSeen: '1 hour ago',
      accessCode: '492-857-316',
      isConnected: false
    },
    {
      id: '3',
      name: 'Omar Mahmoud',
      email: 'omar@partner.com', 
      country: 'UAE',
      os: 'macOS',
      status: 'connecting',
      lastSeen: 'Now',
      accessCode: '651-429-783',
      isConnected: false
    }
  ]);

  const [selectedUser, setSelectedUser] = useState<RemoteUser | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  const handleConnect = async (user: RemoteUser) => {
    setSelectedUser(user);
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus('connected');
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isConnected: true } : u
      ));
    }, 3000);
  };

  const handleDisconnect = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, isConnected: false } : u
      ));
    }
    setSelectedUser(null);
    setConnectionStatus('idle');
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getOSIcon = (os: string) => {
    if (os.includes('Windows')) return <Monitor className="h-4 w-4" />;
    if (os.includes('macOS')) return <Laptop className="h-4 w-4" />;
    if (os.includes('Linux')) return <Server className="h-4 w-4" />;
    return <Smartphone className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">سیستم دسترسی از راه دور</h1>
          <p className="text-gray-600">مدیریت و پشتیبانی دسکتاپ کاربران</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            کاربران آنلاین
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            اتصال فعال
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            ابزارها
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            تنظیمات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {getOSIcon(user.os)}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(user.status)}`} />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{user.country} • {user.os}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {user.accessCode && (
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{user.accessCode}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyAccessCode(user.accessCode!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
                        {user.status === 'online' ? 'آنلاین' : 
                         user.status === 'connecting' ? 'در حال اتصال' : 'آفلاین'}
                      </Badge>

                      <div className="flex gap-2">
                        {user.status === 'online' && !user.isConnected && (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(user)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            اتصال
                          </Button>
                        )}
                        
                        {user.isConnected && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDisconnect}
                          >
                            قطع اتصال
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    آخرین فعالیت: {user.lastSeen}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          {connectionStatus === 'idle' && (
            <Alert>
              <Monitor className="h-4 w-4" />
              <AlertDescription>
                هیچ اتصال فعالی وجود ندارد. از تب کاربران یک کاربر را انتخاب کنید.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'connecting' && selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="animate-spin">
                    <Monitor className="h-5 w-5" />
                  </div>
                  در حال اتصال به {selectedUser.name}
                </CardTitle>
                <CardDescription>
                  لطفاً صبر کنید، اتصال برقرار می‌شود...
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {connectionStatus === 'connected' && selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  متصل به {selectedUser.name}
                </CardTitle>
                <CardDescription>
                  اتصال برقرار شده • {selectedUser.country} • {selectedUser.os}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-white text-center">
                  <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">نمایش دسکتاپ کاربر</p>
                  <p className="text-sm text-gray-400 mt-2">
                    در نسخه واقعی، اینجا تصویر دسکتاپ کاربر نمایش داده می‌شود
                  </p>
                </div>
                
                <div className="mt-4 flex justify-center gap-3">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    تنظیمات
                  </Button>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    امنیت
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    قطع اتصال
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          {/* Video Conferencing Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🎥 سیستم‌های ویدیو کنفرانس
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Monitor className="h-5 w-5" />
                    Jitsi Meet
                  </CardTitle>
                  <CardDescription>
                    سیستم ویدیو کنفرانس پیشرفته
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    ویدیو، صدا، چت و اشتراک‌گذاری صفحه
                  </p>
                  <Button className="w-full" asChild>
                    <a href="/jitsi" target="_blank">
                      <Monitor className="h-4 w-4 mr-2" />
                      ورود به Jitsi Meet
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Users className="h-5 w-5" />
                    WebRTC
                  </CardTitle>
                  <CardDescription>
                    تماس ویدیویی مستقیم P2P
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    ارتباط مستقیم با کیفیت بالا
                  </p>
                  <Button className="w-full" variant="outline" asChild>
                    <a href="/webrtc" target="_blank">
                      <Users className="h-4 w-4 mr-2" />
                      ورود به WebRTC
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Remote Desktop Tools Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🖥️ ابزارهای ریموت دسکتاپ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  TeamViewer
                </CardTitle>
                <CardDescription>
                  محبوب‌ترین نرم‌افزار دسترسی از راه دور
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  برای ویندوز، مک، لینوکس و موبایل
                </p>
                <Button className="w-full" asChild>
                  <a href="https://www.teamviewer.com/en/download/" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    دانلود TeamViewer
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  AnyDesk
                </CardTitle>
                <CardDescription>
                  نرم‌افزار سریع و امن دسترسی از راه دور
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  بدون نیاز به نصب، قابل حمل
                </p>
                <Button className="w-full" asChild>
                  <a href="https://anydesk.com/download" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    دانلود AnyDesk
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Chrome Remote Desktop
                </CardTitle>
                <CardDescription>
                  دسترسی رایگان از طریق مرورگر
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  بدون نیاز به نصب نرم‌افزار جداگانه
                </p>
                <Button className="w-full" asChild>
                  <a href="https://remotedesktop.google.com/" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    باز کردن Chrome Remote
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  RustDesk
                </CardTitle>
                <CardDescription>
                  نرم‌افزار متن‌باز و امن دسترسی از راه دور
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  سریع، امن و کاملاً رایگان
                </p>
                <Button className="w-full" asChild>
                  <a href="https://rustdesk.com/" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    دانلود RustDesk
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Microsoft Remote Desktop
                </CardTitle>
                <CardDescription>
                  برای سیستم‌های ویندوز Server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  RDP داخلی ویندوز
                </p>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  راهنمای تنظیم RDP
                </Button>
              </CardContent>
            </Card>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات امنیتی</CardTitle>
              <CardDescription>
                تنظیمات مربوط به امنیت اتصالات از راه دور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">زمان انقضای جلسه (دقیقه)</Label>
                <Input id="session-timeout" type="number" defaultValue="30" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-connections">حداکثر اتصالات همزمان</Label>
                <Input id="max-connections" type="number" defaultValue="5" />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="require-approval" defaultChecked />
                <Label htmlFor="require-approval">نیاز به تایید برای اتصال</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="log-sessions" defaultChecked />
                <Label htmlFor="log-sessions">ثبت تمام جلسات</Label>
              </div>

              <Button className="w-full">
                ذخیره تنظیمات
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>نکته امنیتی:</strong> همیشه از کاربران بخواهید کدهای دسترسی را در پایان جلسه تغییر دهند.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RemoteDesktop;