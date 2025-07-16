import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Users, 
  ShoppingCart,
  Package,
  CreditCard,
  Shield,
  MessageSquare,
  Phone,
  Wrench,
  Database,
  UserCheck,
  TrendingUp,
  Info,
  BookOpen,
  Code,
  Zap
} from 'lucide-react';

const EmailServiceGuide = () => {
  const [activeTab, setActiveTab] = useState('categories');

  const emailCategories = [
    {
      key: 'admin',
      name: 'مدیریت عمومی',
      icon: <Settings className="w-5 h-5" />,
      email: 'admin@momtazchem.com',
      priority: 'high',
      description: 'برای ایمیل‌های مدیریتی عمومی و پیام‌های سیستمی مهم',
      whenToUse: [
        'پیام‌های مدیریتی عمومی',
        'اطلاعات سیستمی مهم',
        'گزارش‌های عملکرد کلی',
        'تغییرات سیستمی عمده'
      ],
      examples: [
        'گزارش عملکرد ماهانه سیستم',
        'اطلاع‌رسانی تغییرات مهم',
        'پیام‌های فوری مدیریت'
      ]
    },
    {
      key: 'agricultural-fertilizers',
      name: 'بخش کود کشاورزی',
      icon: <Package className="w-5 h-5" />,
      email: 'agricultural@momtazchem.com',
      priority: 'medium',
      description: 'برای استعلامات و سفارشات محصولات کشاورزی و کود',
      whenToUse: [
        'استعلام محصولات کشاورزی',
        'سفارش کود و نهاده‌های کشاورزی',
        'مشاوره فنی کشاورزی',
        'گزارش کیفیت محصولات کشاورزی'
      ],
      examples: [
        'درخواست کود NPK برای مزرعه گندم',
        'استعلام قیمت کود اوره',
        'مشاوره استفاده از کود در باغات'
      ]
    },
    {
      key: 'fuel-additives',
      name: 'بخش افزودنی‌های سوخت',
      icon: <Zap className="w-5 h-5" />,
      email: 'fuel@momtazchem.com',
      priority: 'medium',
      description: 'برای استعلامات محصولات مرتبط با سوخت و افزودنی‌ها',
      whenToUse: [
        'استعلام افزودنی‌های سوخت',
        'سفارش محصولات دیزل و بنزین',
        'مشاوره فنی سوخت',
        'گزارش کیفیت محصولات سوخت'
      ],
      examples: [
        'درخواست افزودنی اکتان بوستر',
        'استعلام قیمت افزودنی دیزل',
        'مشاوره بهبود کیفیت سوخت'
      ]
    },
    {
      key: 'paint-thinner',
      name: 'بخش رنگ و تینر',
      icon: <Package className="w-5 h-5" />,
      email: 'thinner@momtazchem.com',
      priority: 'medium',
      description: 'برای استعلامات محصولات رنگ، تینر و حلال‌ها',
      whenToUse: [
        'استعلام محصولات رنگ',
        'سفارش تینر و حلال‌ها',
        'مشاوره فنی رنگ',
        'گزارش کیفیت محصولات رنگ'
      ],
      examples: [
        'درخواست تینر صنعتی',
        'استعلام قیمت حلال‌های رنگ',
        'مشاوره انتخاب رنگ مناسب'
      ]
    },
    {
      key: 'water-treatment',
      name: 'بخش تصفیه آب',
      icon: <Package className="w-5 h-5" />,
      email: 'water@momtazchem.com',
      priority: 'medium',
      description: 'برای استعلامات محصولات تصفیه آب و تیمار آب',
      whenToUse: [
        'استعلام محصولات تصفیه آب',
        'سفارش مواد شیمیایی تیمار آب',
        'مشاوره فنی تصفیه آب',
        'گزارش کیفیت محصولات آب'
      ],
      examples: [
        'درخواست مواد ضدعفونی آب',
        'استعلام قیمت تصفیه‌کننده آب',
        'مشاوره سیستم تصفیه آب صنعتی'
      ]
    },
    {
      key: 'sales',
      name: 'بخش فروش',
      icon: <ShoppingCart className="w-5 h-5" />,
      email: 'sales@momtazchem.com',
      priority: 'high',
      description: 'برای استعلامات فروش عمومی و پیگیری سفارشات',
      whenToUse: [
        'استعلامات فروش عمومی',
        'پیگیری سفارشات',
        'درخواست قیمت محصولات',
        'مذاکرات تجاری'
      ],
      examples: [
        'استعلام قیمت محصولات شیمیایی',
        'پیگیری وضعیت سفارش',
        'درخواست تخفیف برای خرید عمده'
      ]
    },
    {
      key: 'support',
      name: 'پشتیبانی مشتریان',
      icon: <MessageSquare className="w-5 h-5" />,
      email: 'support@momtazchem.com',
      priority: 'high',
      description: 'برای مسائل فنی، شکایات و پشتیبانی مشتریان',
      whenToUse: [
        'مشکلات فنی محصولات',
        'شکایات مشتریان',
        'راهنمایی استفاده از محصولات',
        'پشتیبانی فنی'
      ],
      examples: [
        'مشکل در استفاده از محصول',
        'شکایت از کیفیت محصول',
        'درخواست راهنمایی فنی'
      ]
    },
    {
      key: 'inventory-alerts',
      name: 'هشدارهای موجودی',
      icon: <AlertTriangle className="w-5 h-5" />,
      email: 'inventory@momtazchem.com',
      priority: 'high',
      description: 'برای هشدارهای کمبود موجودی و مدیریت انبار',
      whenToUse: [
        'کمبود موجودی محصولات',
        'هشدار سطح بحرانی موجودی',
        'گزارش‌های موجودی',
        'درخواست تأمین مجدد'
      ],
      examples: [
        'هشدار کمبود کود NPK',
        'موجودی تینر به حد بحرانی رسیده',
        'گزارش موجودی ماهانه'
      ]
    },
    {
      key: 'order-confirmations',
      name: 'تأیید سفارشات',
      icon: <CheckCircle className="w-5 h-5" />,
      email: 'orders@momtazchem.com',
      priority: 'high',
      description: 'برای تأیید سفارشات و اطلاع‌رسانی وضعیت سفارش',
      whenToUse: [
        'تأیید دریافت سفارش',
        'اطلاع‌رسانی تغییر وضعیت سفارش',
        'تأیید آماده‌سازی سفارش',
        'اطلاع ارسال سفارش'
      ],
      examples: [
        'تأیید سفارش شماره 1001',
        'سفارش شما آماده ارسال است',
        'تغییر وضعیت سفارش به "در حال آماده‌سازی"'
      ]
    },
    {
      key: 'payment-notifications',
      name: 'اطلاعات پرداخت',
      icon: <CreditCard className="w-5 h-5" />,
      email: 'payments@momtazchem.com',
      priority: 'high',
      description: 'برای اطلاع‌رسانی پرداخت‌ها و مسائل مالی',
      whenToUse: [
        'تأیید دریافت پرداخت',
        'اطلاع‌رسانی مشکلات پرداخت',
        'فاکتور و رسید پرداخت',
        'یادآوری پرداخت'
      ],
      examples: [
        'تأیید پرداخت 5,000,000 تومان',
        'مشکل در پردازش پرداخت',
        'ارسال فاکتور رسمی'
      ]
    },
    {
      key: 'security-alerts',
      name: 'هشدارهای امنیتی',
      icon: <Shield className="w-5 h-5" />,
      email: 'security@momtazchem.com',
      priority: 'high',
      description: 'برای هشدارهای امنیتی و مسائل حساس',
      whenToUse: [
        'تلاش‌های ورود مشکوک',
        'هشدارهای امنیتی',
        'نقض قوانین امنیتی',
        'گزارش‌های امنیتی'
      ],
      examples: [
        'تلاش ورود غیرمجاز',
        'هشدار امنیتی سیستم',
        'گزارش فعالیت مشکوک'
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'اولویت بالا';
      case 'medium': return 'اولویت متوسط';
      case 'low': return 'اولویت پایین';
      default: return 'نامشخص';
    }
  };

  const automaticRules = [
    {
      title: 'کمبود موجودی محصولات',
      description: 'هنگامی که موجودی محصولی زیر حد آستانه برسد',
      category: 'inventory-alerts',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />
    },
    {
      title: 'ثبت سفارش جدید',
      description: 'بلافاصله پس از ثبت سفارش توسط مشتری',
      category: 'order-confirmations',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    {
      title: 'تأیید پرداخت',
      description: 'پس از تأیید پرداخت توسط بانک',
      category: 'payment-notifications',
      icon: <CreditCard className="w-5 h-5 text-blue-500" />
    },
    {
      title: 'هشدارهای امنیتی',
      description: 'در صورت تلاش ورود مشکوک یا فعالیت غیرعادی',
      category: 'security-alerts',
      icon: <Shield className="w-5 h-5 text-orange-500" />
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">راهنمای Universal Email Service</h1>
        <p className="text-gray-600">
          راهنمای کامل استفاده از سیستم ایمیل یکپارچه برای مدیریت ارتباطات
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">دسته‌بندی‌ها</TabsTrigger>
          <TabsTrigger value="rules">قوانین استفاده</TabsTrigger>
          <TabsTrigger value="automatic">ایمیل‌های خودکار</TabsTrigger>
          <TabsTrigger value="developer">راهنمای توسعه</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <div className="grid gap-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                سیستم ایمیل یکپارچه شامل 15 دسته‌بندی مختلف برای مدیریت ارتباطات است.
                هر دسته‌بندی برای موضوع خاصی طراحی شده و به ایمیل مخصوص خود ارسال می‌شود.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {emailCategories.map((category) => (
                <Card key={category.key} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {category.icon}
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-gray-600">{category.email}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(category.priority)}>
                        {getPriorityText(category.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{category.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">چه زمانی استفاده شود:</h4>
                        <ul className="text-sm space-y-1">
                          {category.whenToUse.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">نمونه‌های کاربرد:</h4>
                        <ul className="text-sm space-y-1">
                          {category.examples.map((example, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  قوانین اولویت‌بندی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-medium text-red-700">اولویت بالا (حداکثر 1 ساعت پاسخ)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      مدیریت، فروش، پشتیبانی، موجودی، سفارشات، پرداخت، امنیت
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium text-yellow-700">اولویت متوسط (حداکثر 4 ساعت پاسخ)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      کشاورزی، سوخت، رنگ، آب، سیستم، کاربران، CRM
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-green-700">اولویت پایین (حداکثر 24 ساعت پاسخ)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      گزارش‌های دوره‌ای و اطلاعات غیرضروری
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  ساعات کاری ایمیل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>ایمیل‌های فوری:</strong> 24 ساعته</p>
                  <p><strong>ایمیل‌های عادی:</strong> شنبه تا چهارشنبه 8:00 - 18:00</p>
                  <p><strong>پشتیبانی:</strong> شنبه تا پنج‌شنبه 8:00 - 20:00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automatic" className="mt-6">
          <div className="grid gap-6">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                ایمیل‌های خودکار بدون نیاز به دخالت کاربر، بر اساس رویدادهای سیستم ارسال می‌شوند.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {automaticRules.map((rule, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {rule.icon}
                      {rule.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-2">{rule.description}</p>
                    <Badge variant="outline" className="text-xs">
                      دسته‌بندی: {rule.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="developer" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  نحوه استفاده در کد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">استفاده ساده:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { UniversalEmailService } from './universal-email-service';

await UniversalEmailService.sendEmail({
  categoryKey: 'sales',
  to: ['customer@example.com'],
  subject: 'استعلام محصول',
  html: '<p>پیام شما...</p>'
});`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">استفاده با template:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`await UniversalEmailService.sendOrderConfirmationEmail(
  'customer@example.com',
  '1001',
  { total: '1,500,000 تومان' }
);`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">هشدار موجودی:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`await UniversalEmailService.sendInventoryAlertEmail(
  'کود NPK',
  5,
  10
);`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  بهترین روش‌های استفاده
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>همیشه از category مناسب استفاده کنید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>برای ایمیل‌های خودکار از priority مناسب استفاده کنید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>متن ایمیل‌ها را به زبان مناسب (فارسی/انگلیسی) بنویسید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>از template استفاده کنید تا format یکسان باشد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>برای ایمیل‌های حساس از security-alerts استفاده کنید</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailServiceGuide;