import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, MessageSquare, Settings, AlertTriangle, Package, CreditCard, Shield, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  category?: string;
}

const TEMPLATE_DISTRIBUTION = {
  پشتیبانی: {
    color: 'blue',
    icon: MessageSquare,
    templates: ['#01', '#02', '#03'],
    location: '/admin/ticketing-system',
    description: 'قالب‌های پاسخ به درخواست‌های پشتیبانی مشتریان'
  },
  استعلامات: {
    color: 'green', 
    icon: Mail,
    templates: ['#04', '#05', '#07', '#08', '#09', '#10'],
    location: '/admin/inquiries',
    description: 'قالب‌های مرتبط با استعلامات و پیگیری‌های مشتریان'
  },
  مدیریتی: {
    color: 'purple',
    icon: Settings,
    templates: ['#06', '#11', '#12'],
    location: '/admin/user-management',
    description: 'قالب‌های مدیریت کاربران و تنظیمات سیستم'
  },
  اطلاع‌رسانی: {
    color: 'orange',
    icon: AlertTriangle,
    templates: ['#15'],
    location: '/admin/sms',
    description: 'قالب‌های اطلاع‌رسانی عمومی سیستم'
  },
  موجودی: {
    color: 'red',
    icon: Package,
    templates: ['#13', '#17'],
    location: '/admin/warehouse-management',
    description: 'قالب‌های هشدار موجودی و مدیریت انبار'
  },
  پرداخت: {
    color: 'emerald',
    icon: CreditCard,
    templates: ['#14'],
    location: '/admin/payment-settings',
    description: 'قالب‌های تأیید پرداخت و مالی'
  },
  امنیتی: {
    color: 'rose',
    icon: Shield,
    templates: ['#16'],
    location: '/admin/security-management',
    description: 'قالب‌های هشدارهای امنیتی'
  }
};

export default function TemplateDistribution() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email/templates'],
    enabled: !!user
  });

  const getTemplatesByCategory = (categoryTemplates: string[]) => {
    return templates.filter(template => 
      categoryTemplates.some(cat => template.name.startsWith(cat))
    );
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-300 bg-blue-50 text-blue-800',
      green: 'border-green-300 bg-green-50 text-green-800',
      purple: 'border-purple-300 bg-purple-50 text-purple-800',
      orange: 'border-orange-300 bg-orange-50 text-orange-800',
      red: 'border-red-300 bg-red-50 text-red-800',
      emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      rose: 'border-rose-300 bg-rose-50 text-rose-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/admin/email-templates-central')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به مرکز قالب‌ها
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 توزیع قالب‌های ایمیل</h1>
          <p className="text-gray-600 mt-1">
            قالب‌های ایمیل در ۷ بخش مختلف سیستم توزیع شده‌اند
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">کل قالب‌ها</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">بخش‌های سیستم</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <Settings className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">قالب‌های فعال</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.isActive).length}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">دسته‌بندی‌ها</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <Package className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(TEMPLATE_DISTRIBUTION).map(([categoryName, category]) => {
          const categoryTemplates = getTemplatesByCategory(category.templates);
          const IconComponent = category.icon;
          
          return (
            <Card key={categoryName} className={`hover:shadow-lg transition-all duration-300 border-2 ${getColorClasses(category.color)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{categoryName}</h3>
                      <p className="text-sm opacity-80">{category.templates.length} قالب</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTemplates.filter(t => t.isActive).length} فعال
                  </Badge>
                </CardTitle>
                <p className="text-sm opacity-75 mt-2">{category.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Template List */}
                <div className="space-y-2">
                  {categoryTemplates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-2 rounded bg-white/60 border">
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                          {template.name.split(' - ')[0]}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {template.name.includes('- ') ? template.name.split('- ')[1] : template.name}
                        </span>
                      </div>
                      {template.name === '#05 - Momtaz Chemical Follow-up Response' && (
                        <Badge className="bg-green-600 text-white text-xs">⭐ ویژه</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Missing Templates Alert */}
                {category.templates.length > categoryTemplates.length && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ {category.templates.length - categoryTemplates.length} قالب یافت نشد
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full mt-4"
                  onClick={() => setLocation(category.location)}
                  size="sm"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  مشاهده در {categoryName}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Guide */}
      <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <FileText className="w-5 h-5" />
            راهنمای یکپارچه‌سازی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-700">✅ مزایای توزیع قالب‌ها:</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• دسترسی آسان قالب‌ها در بخش مرتبط</li>
                <li>• کاهش پیچیدگی مدیریت</li>
                <li>• سازماندهی بهتر ایمیل‌ها</li>
                <li>• افزایش کارایی تیم‌ها</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-700">🔧 نحوه استفاده:</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• روی دکمه "مشاهده در..." کلیک کنید</li>
                <li>• قالب مورد نظر را انتخاب کنید</li>
                <li>• متغیرها را شخصی‌سازی کنید</li>
                <li>• ایمیل را ارسال کنید</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}