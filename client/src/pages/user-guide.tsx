import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  User, 
  Shield, 
  Settings, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Users, 
  BarChart3, 
  Truck,
  MessageSquare,
  FileText,
  Bell,
  Search,
  Heart,
  Star,
  Download,
  Upload,
  Eye,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Home,
  HelpCircle,
  Clock
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  steps?: string[];
  tips?: string[];
}

const UserGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const userGuides: GuideSection[] = [
    {
      id: 'registration',
      title: 'ثبت نام و ورود به سیستم',
      icon: <User className="h-5 w-5" />,
      content: 'نحوه ایجاد حساب کاربری جدید و ورود به سیستم',
      steps: [
        'روی دکمه "ثبت نام" در صفحه اصلی کلیک کنید',
        'اطلاعات شخصی خود را کامل وارد کنید (نام، نام خانوادگی، ایمیل، شماره تماس)',
        'آدرس دقیق خود را با انتخاب استان و شهر وارد کنید',
        'رمز عبور قوی انتخاب کنید (حداقل 8 کاراکتر)',
        'ایمیل تأیید را بررسی کرده و روی لینک تأیید کلیک کنید',
        'با ایمیل و رمز عبور خود وارد سیستم شوید'
      ],
      tips: [
        'آدرس دقیق برای محاسبه هزینه حمل بسیار مهم است',
        'از ایمیل معتبر استفاده کنید تا اطلاع‌رسانی‌ها را دریافت کنید',
        'رمز عبور خود را در جای امنی نگهداری کنید'
      ]
    },
    {
      id: 'shopping',
      title: 'خرید از فروشگاه',
      icon: <ShoppingCart className="h-5 w-5" />,
      content: 'مراحل خرید محصولات شیمیایی از فروشگاه آنلاین',
      steps: [
        'به بخش فروشگاه مراجعه کنید',
        'از فیلترها یا جستجو برای یافتن محصول مورد نظر استفاده کنید',
        'جزئیات محصول، قیمت و موجودی را بررسی کنید',
        'تعداد مورد نیاز را انتخاب کرده و به سبد خرید اضافه کنید',
        'سبد خرید را مرور کرده و تعداد محصولات را تأیید کنید',
        'روش حمل (هوشمند یا تحویل حضوری) را انتخاب کنید',
        'روش پرداخت (آنلاین، واریز بانکی یا کیف پول) را انتخاب کنید',
        'سفارش خود را نهایی کنید'
      ],
      tips: [
        'برای محصولات آتش‌زا، فقط وسایل نقلیه مجاز انتخاب می‌شوند',
        'وزن کل محموله روی قیمت حمل تأثیر دارد',
        'می‌توانید محصولات را در لیست علاقه‌مندی‌ها ذخیره کنید'
      ]
    },
    {
      id: 'orders',
      title: 'پیگیری سفارشات',
      icon: <Package className="h-5 w-5" />,
      content: 'نحوه مشاهده و پیگیری وضعیت سفارشات',
      steps: [
        'به بخش "سفارشات من" در پروفایل کاربری مراجعه کنید',
        'لیست تمام سفارشات خود را مشاهده کنید',
        'برای مشاهده جزئیات، روی هر سفارش کلیک کنید',
        'وضعیت سفارش (در انتظار پرداخت، تأیید مالی، آماده ارسال، ارسال شده) را بررسی کنید',
        'کد پیگیری و اطلاعات حمل را یادداشت کنید'
      ],
      tips: [
        'وضعیت سفارش به صورت خودکار به‌روزرسانی می‌شود',
        'برای سفارشات فوری با پشتیبانی تماس بگیرید',
        'فیش پرداخت را تا تحویل سفارش نگه دارید'
      ]
    },
    {
      id: 'wallet',
      title: 'مدیریت کیف پول',
      icon: <CreditCard className="h-5 w-5" />,
      content: 'استفاده از کیف پول الکترونیکی برای پرداخت‌ها',
      steps: [
        'به بخش "کیف پول" در پروفایل کاربری مراجعه کنید',
        'موجودی فعلی کیف پول خود را مشاهده کنید',
        'برای شارژ کیف پول، مبلغ مورد نظر را وارد کنید',
        'روش شارژ (واریز بانکی یا پرداخت آنلاین) را انتخاب کنید',
        'هنگام خرید، از موجودی کیف پول برای پرداخت استفاده کنید'
      ],
      tips: [
        'اضافه پرداخت‌ها خودکار به کیف پول اضافه می‌شود',
        'کم‌پرداخت‌ها از کیف پول کسر می‌شود',
        'تاریخچه تراکنش‌های کیف پول را مرور کنید'
      ]
    },
    {
      id: 'profile',
      title: 'مدیریت پروفایل',
      icon: <Settings className="h-5 w-5" />,
      content: 'ویرایش اطلاعات شخصی و تنظیمات حساب کاربری',
      steps: [
        'به پروفایل کاربری خود مراجعه کنید',
        'اطلاعات شخصی (نام، ایمیل، شماره تماس) را ویرایش کنید',
        'آدرس دقیق خود را به‌روزرسانی کنید',
        'رمز عبور خود را تغییر دهید',
        'تنظیمات اطلاع‌رسانی را پیکربندی کنید'
      ],
      tips: [
        'آدرس دقیق برای محاسبه هزینه حمل ضروری است',
        'تغییرات را ذخیره کنید تا اعمال شوند',
        'اطلاعات تماس را به‌روز نگه دارید'
      ]
    }
  ];

  const adminGuides: GuideSection[] = [
    {
      id: 'dashboard',
      title: 'داشبورد مدیریت',
      icon: <BarChart3 className="h-5 w-5" />,
      content: 'مرور کلی عملکرد سیستم و آمارهای مهم',
      steps: [
        'با نام کاربری admin و رمز admin123 وارد پنل مدیریت شوید',
        'آمارهای کلی (فروش، سفارشات، مشتریان) را بررسی کنید',
        'نمودارهای فروش و درآمد را تحلیل کنید',
        'لیست آخرین سفارشات و فعالیت‌ها را مشاهده کنید'
      ]
    },
    {
      id: 'order-management',
      title: 'مدیریت سفارشات',
      icon: <Package className="h-5 w-5" />,
      content: 'پردازش و مدیریت سفارشات مشتریان',
      steps: [
        'به بخش "مدیریت سفارشات" مراجعه کنید',
        'سفارشات در انتظار بررسی را مشاهده کنید',
        'جزئیات هر سفارش را بررسی کنید',
        'سفارشات را تأیید یا رد کنید',
        'وضعیت ارسال را به‌روزرسانی کنید'
      ]
    },
    {
      id: 'financial',
      title: 'مدیریت مالی',
      icon: <CreditCard className="h-5 w-5" />,
      content: 'بررسی و تأیید پرداخت‌های مشتریان',
      steps: [
        'به بخش "امور مالی" مراجعه کنید',
        'فیش‌های واریزی مشتریان را بررسی کنید',
        'مبلغ دقیق روی فیش را در فیلد مربوطه وارد کنید',
        'در صورت اختلاف مبلغ، سیستم خودکار کیف پول را مدیریت می‌کند',
        'سفارشات را تأیید یا رد کنید'
      ],
      tips: [
        'اضافه پرداخت‌ها خودکار به کیف پول مشتری اضافه می‌شود',
        'کم‌پرداخت‌ها از کیف پول مشتری کسر می‌شود',
        'در صورت ناکافی بودن کیف پول، پیام خطا نمایش داده می‌شود'
      ]
    },
    {
      id: 'inventory',
      title: 'مدیریت انبار',
      icon: <Package className="h-5 w-5" />,
      content: 'کنترل موجودی و مدیریت محصولات',
      steps: [
        'به بخش "مدیریت انبار" مراجعه کنید',
        'موجودی محصولات را بررسی کنید',
        'محصولات کم‌موجود را شناسایی کنید',
        'ورود و خروج کالا را ثبت کنید',
        'گزارش‌های موجودی را تهیه کنید'
      ]
    },
    {
      id: 'logistics',
      title: 'مدیریت لجستیک',
      icon: <Truck className="h-5 w-5" />,
      content: 'تنظیم روش‌های حمل و نقل و قیمت‌گذاری',
      steps: [
        'به بخش "مدیریت لجستیک" مراجعه کنید',
        'شهرها و استان‌های عراق را مدیریت کنید',
        'فاصله شهرها از اربیل را تنظیم کنید',
        'الگوهای خودرو و ظرفیت‌ها را پیکربندی کنید',
        'مجوزهای حمل مواد آتش‌زا را تنظیم کنید'
      ]
    },
    {
      id: 'customers',
      title: 'مدیریت مشتریان (CRM)',
      icon: <Users className="h-5 w-5" />,
      content: 'مدیریت اطلاعات و ارتباط با مشتریان',
      steps: [
        'به بخش "مدیریت مشتریان" مراجعه کنید',
        'لیست مشتریان و اطلاعات آن‌ها را مشاهده کنید',
        'اطلاعات مشتریان را ویرایش کنید',
        'تاریخچه سفارشات هر مشتری را بررسی کنید',
        'گزارش‌های عملکرد مشتریان را استخراج کنید'
      ]
    }
  ];

  const superAdminGuides: GuideSection[] = [
    {
      id: 'site-management',
      title: 'مدیریت سایت',
      icon: <Settings className="h-5 w-5" />,
      content: 'تنظیمات پیشرفته و کنترل کلی سیستم',
      steps: [
        'به پنل "مدیریت سایت" دسترسی پیدا کنید',
        'تنظیمات کلی سایت را پیکربندی کنید',
        'محتوای صفحات را مدیریت کنید',
        'تنظیمات SEO و بهینه‌سازی را اعمال کنید'
      ]
    },
    {
      id: 'content-management',
      title: 'مدیریت محتوا',
      icon: <FileText className="h-5 w-5" />,
      content: 'کنترل نمایش و مخفی کردن عناصر سایت',
      steps: [
        'به بخش "مدیریت محتوا" مراجعه کنید',
        'وضعیت نمایش بنر تخفیف را کنترل کنید',
        'قابلیت‌های هوش مصنوعی را فعال/غیرفعال کنید',
        'محتوای صفحات اصلی را ویرایش کنید'
      ]
    },
    {
      id: 'system-monitoring',
      title: 'نظارت بر سیستم',
      icon: <Eye className="h-5 w-5" />,
      content: 'مانیتورینگ عملکرد و امنیت سیستم',
      steps: [
        'لاگ‌های سیستم را بررسی کنید',
        'عملکرد سرور و پایگاه داده را کنترل کنید',
        'آمار بازدید و استفاده از سیستم را تحلیل کنید',
        'تهدیدات امنیتی را شناسایی کنید'
      ]
    },
    {
      id: 'backup-restore',
      title: 'پشتیبان‌گیری و بازیابی',
      icon: <Download className="h-5 w-5" />,
      content: 'مدیریت پشتیبان‌گیری و بازیابی اطلاعات',
      steps: [
        'پشتیبان‌گیری خودکار را پیکربندی کنید',
        'پشتیبان دستی از پایگاه داده تهیه کنید',
        'فایل‌های مهم سیستم را پشتیبان‌گیری کنید',
        'در صورت نیاز، اطلاعات را بازیابی کنید'
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const renderGuideSection = (guide: GuideSection) => (
    <Card key={guide.id} className="mb-4">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleSection(guide.id)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {guide.icon}
            <span>{guide.title}</span>
          </div>
          {expandedSection === guide.id ? <ChevronDown /> : <ChevronRight />}
        </CardTitle>
      </CardHeader>
      
      {expandedSection === guide.id && (
        <CardContent>
          <p className="text-gray-600 mb-4">{guide.content}</p>
          
          {guide.steps && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                مراحل انجام:
              </h4>
              <ol className="space-y-2">
                {guide.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="min-w-fit">
                      {index + 1}
                    </Badge>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {guide.tips && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                نکات مهم:
              </h4>
              <ul className="space-y-1">
                {guide.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500 mt-1 min-w-fit" />
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">راهنمای استفاده از سایت</h1>
              <p className="text-gray-600">راهنمای کامل برای تمامی کاربران سیستم</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              کاربران عادی
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ادمین‌ها
            </TabsTrigger>
            <TabsTrigger value="superadmin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              مدیران ارشد
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              راهنمای جامع پروژه
            </TabsTrigger>
          </TabsList>

          {/* Users Guide */}
          <TabsContent value="users">
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">راهنمای کاربران عادی</h2>
                  </div>
                  <p className="text-gray-700">
                    این بخش شامل راهنمای کاملی برای مشتریان و کاربران عادی سیستم است. 
                    از ثبت نام اولیه تا مدیریت سفارشات و استفاده از تمامی امکانات فروشگاه.
                  </p>
                </CardContent>
              </Card>
              
              <ScrollArea className="h-[600px]">
                {userGuides.map(renderGuideSection)}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Admin Guide */}
          <TabsContent value="admin">
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-green-600" />
                    <h2 className="text-xl font-semibold">راهنمای ادمین‌ها</h2>
                  </div>
                  <p className="text-gray-700">
                    راهنمای کاملی برای مدیران مختلف بخش‌ها شامل مدیریت سفارشات، امور مالی، 
                    انبار، لجستیک و ارتباط با مشتریان.
                  </p>
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>ورود:</strong> نام کاربری: admin | رمز عبور: admin123
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <ScrollArea className="h-[600px]">
                {adminGuides.map(renderGuideSection)}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Super Admin Guide */}
          <TabsContent value="superadmin">
            <div className="space-y-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-semibold">راهنمای مدیران ارشد</h2>
                  </div>
                  <p className="text-gray-700">
                    راهنمای پیشرفته برای مدیران ارشد سیستم شامل تنظیمات کلی، مدیریت محتوا، 
                    نظارت بر سیستم و عملیات پشتیبان‌گیری.
                  </p>
                  <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>توجه:</strong> این بخش نیازمند دسترسی‌های ویژه مدیریت است
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <ScrollArea className="h-[600px]">
                {superAdminGuides.map(renderGuideSection)}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Project Documentation Section */}
          <TabsContent value="project">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-semibold">راهنمای جامع پروژه - به روزرسانی شده</h2>
                  </div>
                  <p className="text-gray-700">
                    مستندات کامل و جامع پلتفرم Momtazchem شامل معماری سیستم، ویژگی‌های کلیدی، 
                    ۳۴+ ماژول مدیریتی، سیستم چندزبانه، و تمامی امکانات تجاری و فنی.
                  </p>
                </CardContent>
              </Card>

              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    نمای کلی سیستم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">ویژگی‌های کلیدی:</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• پشتیبانی کامل از 4 زبان (انگلیسی، عربی، کردی، ترکی)</li>
                        <li>• ۳۴+ ماژول مدیریتی یکپارچه</li>
                        <li>• سیستم تجارت الکترونیک پیشرفته</li>
                        <li>• ردیابی GPS در ۱۱ شهر عراق</li>
                        <li>• سیستم CRM جامع</li>
                        <li>• تحلیل‌های لحظه‌ای</li>
                        <li>• اتوماسیون ایمیل با ۱۸+ قالب</li>
                        <li>• مدیریت موجودی با سیستم بارکد</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-600">فناوری‌های استفاده شده:</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• React 18 with TypeScript</li>
                        <li>• Tailwind CSS</li>
                        <li>• PostgreSQL (Neon Cloud)</li>
                        <li>• Drizzle ORM</li>
                        <li>• Express.js</li>
                        <li>• TanStack Query</li>
                        <li>• Shadcn/ui Components</li>
                        <li>• Framer Motion</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Administrative Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    ماژول‌های مدیریتی (۳۴+ ماژول)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">ماژول‌های اصلی (۱-۱۰):</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• KPI Dashboard</li>
                        <li>• Management Dashboard</li>
                        <li>• Shop Synchronization</li>
                        <li>• Product Management</li>
                        <li>• Order Management & Tracking</li>
                        <li>• Warehouse Management</li>
                        <li>• Logistics Management</li>
                        <li>• Inquiry Management</li>
                        <li>• CRM Management</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-600">عملیات تجاری (۱۱-۲۰):</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Barcode Management</li>
                        <li>• Email Settings</li>
                        <li>• Database Backup</li>
                        <li>• SEO Management</li>
                        <li>• Categories Management</li>
                        <li>• SMS Management</li>
                        <li>• Factory Management</li>
                        <li>• User Management</li>
                        <li>• Payment Management</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-purple-600">مالی و تحلیلی (۲۱-۳۴+):</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Financial Management</li>
                        <li>• Wallet Management</li>
                        <li>• Geographic Analytics</li>
                        <li>• AI Settings</li>
                        <li>• Content Management</li>
                        <li>• Marketing Module</li>
                        <li>• Site Management</li>
                        <li>• Remote Desktop</li>
                        <li>• Server Configuration</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Updates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    آخرین به‌روزرسانی‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ بازسازی کامل سیستم پیگیری سفارشات (۲۹ ژانویه ۲۰۲۵)
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• رابط کاربری مطابق با ساختار واقعی پایگاه داده ساخته شد</li>
                        <li>• نمایش ۴۶ سفارش موجود در سیستم با جزئیات کامل</li>
                        <li>• جستجو و فیلتر براساس وضعیت و اطلاعات مشتری</li>
                        <li>• مشاهده جزئیات کامل هر سفارش در مودال</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        ✅ پیاده‌سازی کامل ماژول مارکتینگ (ماژول ۳۳)
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• سیستم وفاداری مشتری با امتیازدهی</li>
                        <li>• ایمیل مارکتینگ با ۱۸+ قالب</li>
                        <li>• تحلیل بازارهای بین‌المللی</li>
                        <li>• بخش‌بندی بازار و تحلیل رقبا</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-semibold text-orange-800 mb-2">
                        ✅ سیستم امنیت مواد آتش‌زا و انتخاب هوشمند خودرو
                      </h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• کنترل ایمنی حمل مواد آتش‌زا</li>
                        <li>• انتخاب خودکار اتوبوس بین‌شهری</li>
                        <li>• الگوریتم بهینه‌سازی هزینه حمل</li>
                        <li>• سیستم مدیریت جغرافیای بین‌المللی</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Downloads Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-indigo-600" />
                    دانلود مستندات کامل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/PROJECT_PROPOSAL_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">پروپوزال جامع</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">راهنمای کامل پروژه دوزبانه</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/TECHNICAL_ARCHITECTURE_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">معماری فنی</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">مستندات تکنیکال کامل</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/BUSINESS_PROPOSAL_EXECUTIVE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">پروپوزال تجاری</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">تحلیل ROI و ارزش تجاری</span>
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-800">معماری سیستم:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-semibold mb-2">Frontend:</h5>
                        <ul className="space-y-1 text-gray-700">
                          <li>• React 18 با TypeScript</li>
                          <li>• Tailwind CSS برای طراحی واکنش‌گرا</li>
                          <li>• Wouter برای routing سبک</li>
                          <li>• TanStack Query برای مدیریت state</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">Backend:</h5>
                        <ul className="space-y-1 text-gray-700">
                          <li>• Node.js با Express.js</li>
                          <li>• PostgreSQL (Neon Cloud)</li>
                          <li>• Drizzle ORM</li>
                          <li>• Express Sessions با MemoryStore</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Downloads Section */}
          <TabsContent value="downloads">
            <div className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-6 w-6 text-amber-600" />
                    <h2 className="text-xl font-semibold">دانلود مستندات پروژه</h2>
                  </div>
                  <p className="text-gray-700">
                    فایل‌های مستندات کامل پروژه شامل راهنماهای فنی، پروپوزال کسب‌وکار و اسناد معماری سیستم
                  </p>
                </CardContent>
              </Card>

              {/* Word Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    فایل‌های Word (.docx) - راهنمای جامع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/PROJECT_PROPOSAL_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">پروپوزال-اصلی</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">راهنمای جامع پروژه</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/TECHNICAL_ARCHITECTURE_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">پروپوزال-تکنیکال</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">کمپوتری ROI تخلیل</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/download/BUSINESS_PROPOSAL_EXECUTIVE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">راهنمای-فنی</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">معرفی فنی</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* HTML Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    فایل‌های HTML (مشاهده آنلاین) - PDF تبدیلی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/view/PROJECT_PROPOSAL_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">پروپوزال-اصلی</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">مشاهده آنلاین</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/view/TECHNICAL_ARCHITECTURE_GUIDE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">پروپوزال-تکنیکال</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">مشاهده آنلاین</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.open('/api/view/BUSINESS_PROPOSAL_EXECUTIVE', '_blank')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">راهنمای-فنی</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right">مشاهده آنلاین</span>
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">نحوه استفاده:</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• دکمه‌های Download برای دانلود فایل‌های Word اصلی</li>
                      <li>• دکمه‌های مشاهده برای باز کردن نسخه HTML در مرورگر</li>
                      <li>• امکان تبدیل HTML به PDF از طریق گزینه Print مرورگر</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <HelpCircle className="h-5 w-5" />
              <span>نیاز به کمک بیشتر دارید؟</span>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              تماس با پشتیبانی
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;