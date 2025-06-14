import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Package, Users, Database, QrCode, Mail, BarChart3, Settings, Shield, FileText, Briefcase } from "lucide-react";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Get user stats for dashboard overview
  const { data: userStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Define role-based access modules
  const getAccessibleModules = () => {
    const modules = [];

    // Product Management - for product managers and super admin
    if (user?.role === 'super_admin' || user?.role === 'products_admin') {
      modules.push({
        title: 'مدیریت محصولات',
        description: 'مدیریت محصولات و کاتالوگ شرکت',
        icon: <Package className="w-8 h-8" />,
        path: '/products/manager',
        color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        iconColor: 'text-blue-600',
        badge: 'محصولات',
        badgeColor: 'bg-blue-100 text-blue-800'
      });
    }

    // CRM Management - for CRM managers and super admin
    if (user?.role === 'super_admin' || user?.role === 'crm_admin') {
      modules.push({
        title: 'مدیریت CRM',
        description: 'مدیریت مشتریان و روابط فروش',
        icon: <Users className="w-8 h-8" />,
        path: '/crm',
        color: 'bg-green-50 border-green-200 hover:bg-green-100',
        iconColor: 'text-green-600',
        badge: 'مشتریان',
        badgeColor: 'bg-green-100 text-green-800'
      });
    }

    // Shop Management - for shop managers and super admin
    if (user?.role === 'super_admin' || user?.role === 'shop_admin') {
      modules.push({
        title: 'مدیریت فروشگاه',
        description: 'مدیریت فروشگاه آنلاین و سفارشات',
        icon: <Briefcase className="w-8 h-8" />,
        path: '/shop-admin',
        color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        iconColor: 'text-purple-600',
        badge: 'فروشگاه',
        badgeColor: 'bg-purple-100 text-purple-800'
      });
    }

    // Analytics - for analytics managers and super admin
    if (user?.role === 'super_admin' || user?.role === 'analytics_admin') {
      modules.push({
        title: 'گزارش‌گیری و آمار',
        description: 'مشاهده گزارش‌ها و آمارهای سیستم',
        icon: <BarChart3 className="w-8 h-8" />,
        path: '/sales-analytics',
        color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        iconColor: 'text-orange-600',
        badge: 'آمار',
        badgeColor: 'bg-orange-100 text-orange-800'
      });
    }

    // Content Management - for content managers and super admin
    if (user?.role === 'super_admin' || user?.role === 'content_admin') {
      modules.push({
        title: 'مدیریت محتوا',
        description: 'مدیریت محتوا و صفحات سایت',
        icon: <FileText className="w-8 h-8" />,
        path: '/admin/specialists',
        color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
        iconColor: 'text-teal-600',
        badge: 'محتوا',
        badgeColor: 'bg-teal-100 text-teal-800'
      });
    }

    return modules;
  };

  // Admin-only modules (super admin access)
  const getAdminModules = () => {
    if (user?.role !== 'super_admin') return [];

    return [
      {
        title: 'مدیریت کاربران',
        description: 'مدیریت کاربران و نقش‌های سیستم',
        icon: <Shield className="w-8 h-8" />,
        path: '/admin/user-management',
        color: 'bg-red-50 border-red-200 hover:bg-red-100',
        iconColor: 'text-red-600',
        badge: 'کاربران',
        badgeColor: 'bg-red-100 text-red-800'
      },
      {
        title: 'مدیریت دیتابیس',
        description: 'پشتیبان‌گیری و مدیریت دیتابیس',
        icon: <Database className="w-8 h-8" />,
        path: '/admin/database-management',
        color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
        iconColor: 'text-gray-600',
        badge: 'دیتابیس',
        badgeColor: 'bg-gray-100 text-gray-800'
      },
      {
        title: 'تنظیمات ایمیل',
        description: 'پیکربندی سرویس‌های ایمیل',
        icon: <Mail className="w-8 h-8" />,
        path: '/admin/email-settings',
        color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
        iconColor: 'text-indigo-600',
        badge: 'ایمیل',
        badgeColor: 'bg-indigo-100 text-indigo-800'
      }
    ];
  };

  // Utility modules accessible to all authenticated users
  const getUtilityModules = () => [
    {
      title: 'بارکد اسکنر',
      description: 'اسکن بارکد و مدیریت موجودی',
      icon: <QrCode className="w-8 h-8" />,
      path: '/admin/barcode-inventory',
      color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      iconColor: 'text-cyan-600',
      badge: 'ابزار',
      badgeColor: 'bg-cyan-100 text-cyan-800'
    }
  ];

  const accessibleModules = getAccessibleModules();
  const adminModules = getAdminModules();
  const utilityModules = getUtilityModules();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">داشبورد مدیریت</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">سیستم مدیریت جامع شرکت ممتاز شیمی</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.username}</span>
              <Badge variant="outline">{user?.role}</Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                logout();
                setLocation("/admin/login");
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">محصولات فعال</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.activeProducts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مشتریان</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalCustomers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سفارشات امروز</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.todayOrders || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Management Modules */}
      {accessibleModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">ماژول‌های مدیریت</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleModules.map((module, index) => (
              <Card key={index} className={`cursor-pointer transition-all ${module.color}`} onClick={() => setLocation(module.path)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-white ${module.iconColor}`}>
                      {module.icon}
                    </div>
                    <Badge className={module.badgeColor}>
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin-Only Modules */}
      {adminModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">مدیریت سیستم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((module, index) => (
              <Card key={index} className={`cursor-pointer transition-all ${module.color}`} onClick={() => setLocation(module.path)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-white ${module.iconColor}`}>
                      {module.icon}
                    </div>
                    <Badge className={module.badgeColor}>
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Utility Modules */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ابزارهای کاربردی</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilityModules.map((module, index) => (
            <Card key={index} className={`cursor-pointer transition-all ${module.color}`} onClick={() => setLocation(module.path)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-white ${module.iconColor}`}>
                    {module.icon}
                  </div>
                  <Badge className={module.badgeColor}>
                    {module.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {accessibleModules.slice(0, 3).map((module, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex flex-col gap-1"
              onClick={() => setLocation(module.path)}
            >
              <div className={module.iconColor}>
                {module.icon}
              </div>
              <span className="text-xs">{module.badge}</span>
            </Button>
          ))}
          
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-1"
            onClick={() => setLocation('/admin/barcode-inventory')}
          >
            <QrCode className="w-6 h-6 text-cyan-600" />
            <span className="text-xs">بارکد</span>
          </Button>
          
          {user?.role === 'super_admin' && (
            <>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => setLocation('/admin/user-management')}
              >
                <Shield className="w-6 h-6 text-red-600" />
                <span className="text-xs">کاربران</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => setLocation('/admin/database-management')}
              >
                <Database className="w-6 h-6 text-gray-600" />
                <span className="text-xs">دیتابیس</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            اطلاعات دسترسی
          </CardTitle>
          <CardDescription>
            شما با نقش <strong>{user?.role}</strong> وارد شده‌اید. 
            {accessibleModules.length > 0 
              ? ` به ${accessibleModules.length} ماژول مدیریتی دسترسی دارید.`
              : ' فقط به ابزارهای کاربردی دسترسی دارید.'
            }
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}