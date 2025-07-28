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
  HelpCircle
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
          <TabsList className="grid w-full grid-cols-3">
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