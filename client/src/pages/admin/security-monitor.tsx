import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity, 
  Lock, 
  FileText, 
  Users, 
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function SecurityMonitor() {
  const [, setLocation] = useLocation();
  const [securityStatus, setSecurityStatus] = useState({
    activeThreats: 0,
    recentLoginAttempts: 0,
    monitoring: true,
    lastCheck: new Date().toISOString()
  });

  // Simulate security monitoring data
  const securityData = {
    threats: [
      {
        id: 1,
        type: "تلاش ورود مشکوک",
        severity: "HIGH",
        ip: "192.168.1.100",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: "5 تلاش ورود ناموفق در 15 دقیقه"
      },
      {
        id: 2,
        type: "آپلود فایل مشکوک",
        severity: "MEDIUM",
        ip: "10.0.0.5",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: "آپلود فایل با پسوند خطرناک"
      }
    ],
    activities: [
      {
        id: 1,
        action: "ورود موفق ادمین",
        user: "admin@momtazchem.com",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        ip: "192.168.1.50"
      },
      {
        id: 2,
        action: "تغییر تنظیمات امنیتی",
        user: "mr.ghafari@gmail.com",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        ip: "192.168.1.51"
      },
      {
        id: 3,
        action: "دانلود بکاپ دیتابیس",
        user: "admin@momtazchem.com",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ip: "192.168.1.50"
      }
    ],
    stats: {
      totalUsers: 45,
      activeAdmins: 3,
      secureConnections: 98.5,
      lastSecurityScan: new Date(Date.now() - 60 * 60 * 1000)
    }
  };

  // Update security status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStatus(prev => ({
        ...prev,
        lastCheck: new Date().toISOString()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "HIGH": return <XCircle className="w-4 h-4" />;
      case "MEDIUM": return <AlertTriangle className="w-4 h-4" />;
      case "LOW": return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin/site-management")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت به مدیریت سایت
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-red-600" />
                نظارت امنیتی
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                نظارت و گزارش‌گیری امنیت سیستم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={securityStatus.monitoring ? "default" : "secondary"} className="bg-green-100 text-green-800">
              {securityStatus.monitoring ? "فعال" : "غیرفعال"}
            </Badge>
            <span className="text-sm text-gray-500">
              آخرین بررسی: {formatDistanceToNow(new Date(securityStatus.lastCheck), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تهدیدات فعال</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{securityData.threats.length}</div>
              <p className="text-xs text-gray-600">نیاز به بررسی فوری</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityData.stats.totalUsers}</div>
              <p className="text-xs text-gray-600">{securityData.stats.activeAdmins} ادمین فعال</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اتصالات امن</CardTitle>
              <Lock className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityData.stats.secureConnections}%</div>
              <p className="text-xs text-gray-600">HTTPS فعال</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آخرین اسکن</CardTitle>
              <Eye className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDistanceToNow(securityData.stats.lastSecurityScan, { addSuffix: true })}
              </div>
              <p className="text-xs text-gray-600">بدون مشکل</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Tabs */}
        <Tabs defaultValue="threats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="threats">تهدیدات</TabsTrigger>
            <TabsTrigger value="activities">فعالیت‌ها</TabsTrigger>
            <TabsTrigger value="reports">گزارش‌ها</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  تهدیدات امنیتی شناسایی شده
                </CardTitle>
                <CardDescription>
                  فعالیت‌های مشکوک و تهدیدات شناسایی شده در سیستم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityData.threats.map((threat) => (
                    <Alert key={threat.id} className="border-l-4 border-l-red-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(threat.severity)}
                          <div>
                            <AlertTitle className="text-sm font-medium">
                              {threat.type}
                            </AlertTitle>
                            <AlertDescription className="text-xs text-gray-600 mt-1">
                              IP: {threat.ip} • {threat.details}
                            </AlertDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getSeverityColor(threat.severity)}>
                                {threat.severity}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(threat.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          بررسی
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  فعالیت‌های اخیر سیستم
                </CardTitle>
                <CardDescription>
                  لاگ فعالیت‌های ادمین‌ها و تغییرات سیستم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityData.activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{activity.action}</p>
                          <p className="text-xs text-gray-600">
                            کاربر: {activity.user} • IP: {activity.ip}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  گزارش‌های امنیتی
                </CardTitle>
                <CardDescription>
                  دانلود و بررسی گزارش‌های امنیتی سیستم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">گزارش امنیت هفتگی</p>
                        <p className="text-xs text-gray-600">تحلیل فعالیت‌های هفته گذشته</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">گزارش تهدیدات</p>
                        <p className="text-xs text-gray-600">فهرست تهدیدات شناسایی شده</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">گزارش ورود کاربران</p>
                        <p className="text-xs text-gray-600">تحلیل الگوهای ورود به سیستم</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">گزارش تنظیمات امنیتی</p>
                        <p className="text-xs text-gray-600">وضعیت کنونی تنظیمات امنیت</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  تنظیمات امنیتی
                </CardTitle>
                <CardDescription>
                  پیکربندی سیستم نظارت امنیتی
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">نظارت بلادرنگ</p>
                      <p className="text-sm text-gray-600">فعال‌سازی نظارت مداوم بر فعالیت‌ها</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      فعال
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">هشدارهای ایمیلی</p>
                      <p className="text-sm text-gray-600">ارسال هشدار به ادمین‌ها در صورت تهدید</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      فعال
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">محدودیت تعداد درخواست</p>
                      <p className="text-sm text-gray-600">Rate Limiting برای جلوگیری از حملات</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      100 درخواست / 15 دقیقه
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">هدرهای امنیتی</p>
                      <p className="text-sm text-gray-600">تنظیمات امنیتی HTTP Headers</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      فعال
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SecurityMonitor;