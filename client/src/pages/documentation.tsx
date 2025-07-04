import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Globe, 
  Settings, 
  Code2, 
  Users, 
  Briefcase,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function DocumentationPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string, language: string) => {
    const downloadKey = `${type}-${language}`;
    setDownloading(downloadKey);
    
    try {
      const response = await fetch(`/api/documentation/${type}/${language}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `documentation-${type}-${language}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`خطا در دانلود: ${error}`);
    } finally {
      setDownloading(null);
    }
  };

  const documentTypes = [
    {
      id: 'proposal',
      title: 'پروپوزال پروژه',
      titleEn: 'Project Proposal',
      description: 'پروپوزال جامع برای پیمانکار شامل تمام ماژول‌ها و قابلیت‌های سیستم',
      descriptionEn: 'Comprehensive project proposal for contractors including all modules and system capabilities',
      icon: Briefcase,
      color: 'bg-purple-500',
      features: [
        'خلاصه اجرایی و نمای کلی پروژه',
        '25+ ماژول مدیریتی یکپارچه',
        'معماری فنی و پشته تکنولوژی',
        'پشتیبانی چندزبانه (4 زبان)',
        'ویژگی‌های تجارت الکترونیک',
        'عملکرد و مقیاس‌پذیری',
        'جدول زمانی پیاده‌سازی',
        'ارزش کسب‌وکار و ROI'
      ]
    },
    {
      id: 'user',
      title: 'راهنمای کاربری',
      titleEn: 'User Guide',
      description: 'راهنمای کامل برای استفاده از سایت توسط مشتریان',
      descriptionEn: 'Complete guide for customers using the website',
      icon: Users,
      color: 'bg-blue-500',
      features: [
        'شروع کار و ایجاد حساب کاربری',
        'مرور و جستجوی محصولات',
        'سبد خرید و فرآیند خرید',
        'مدیریت حساب و کیف پول',
        'ردیابی سفارشات',
        'روش‌های پرداخت',
        'پشتیبانی و تماس'
      ]
    },
    {
      id: 'admin',
      title: 'راهنمای مدیریت',
      titleEn: 'Administrator Guide',
      description: 'راهنمای کامل پنل مدیریت و تمام ماژول‌های اداری',
      descriptionEn: 'Complete admin panel guide and all administrative modules',
      icon: Settings,
      color: 'bg-green-500',
      features: [
        'داشبورد مدیریت و Site Management',
        'مدیریت محتوا (CMS)',
        'مدیریت محصولات و بارکد',
        'سیستم CRM و مشتریان',
        'مدیریت سفارشات',
        'خودکارسازی ایمیل',
        'مدیریت SEO',
        'یکپارچگی هوش مصنوعی'
      ]
    },
    {
      id: 'technical',
      title: 'مستندات فنی',
      titleEn: 'Technical Documentation',
      description: 'مستندات فنی برای توسعه‌دهندگان و تیم فنی',
      descriptionEn: 'Technical documentation for developers and technical team',
      icon: Code2,
      color: 'bg-orange-500',
      features: [
        'معماری سیستم',
        'ساختار پایگاه داده',
        'مستندات API',
        'پیکربندی و محیط',
        'امنیت و عملکرد',
        'یکپارچگی‌های خارجی',
        'نصب و راه‌اندازی'
      ]
    },
    {
      id: 'complete',
      title: 'مستندات کامل',
      titleEn: 'Complete Documentation',
      description: 'تمام مستندات در یک فایل جامع',
      descriptionEn: 'All documentation in one comprehensive file',
      icon: FileText,
      color: 'bg-gray-500',
      features: [
        'شامل تمام بخش‌های فوق',
        'راهنمای کاربری کامل',
        'راهنمای مدیریت جامع',
        'مستندات فنی دقیق',
        'یک منبع کامل برای همه'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            مستندات پلتفرم ممتازکم
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            دسترسی به مستندات کامل، راهنماهای کاربری، مستندات فنی و پروپوزال پروژه
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="text-sm">
              4 زبان پشتیبانی شده
            </Badge>
            <Badge variant="outline" className="text-sm">
              25+ ماژول مستندسازی شده
            </Badge>
            <Badge variant="outline" className="text-sm">
              PDF های آماده دانلود
            </Badge>
          </div>
        </div>

        {/* Documentation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {documentTypes.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card key={doc.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${doc.color} p-2 rounded-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{doc.title}</CardTitle>
                      <p className="text-sm text-gray-500">{doc.titleEn}</p>
                    </div>
                  </div>
                  <CardDescription className="text-right">
                    {doc.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">محتویات:</h4>
                    <ul className="space-y-1">
                      {doc.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-right">{feature}</span>
                        </li>
                      ))}
                      {doc.features.length > 4 && (
                        <li className="text-sm text-gray-500 text-right">
                          + {doc.features.length - 4} مورد دیگر...
                        </li>
                      )}
                    </ul>
                  </div>

                  <Separator />

                  {/* Download Buttons */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">دانلود:</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(doc.id, 'fa')}
                        disabled={downloading === `${doc.id}-fa`}
                      >
                        {downloading === `${doc.id}-fa` ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="mr-2">فارسی</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(doc.id, 'en')}
                        disabled={downloading === `${doc.id}-en`}
                      >
                        {downloading === `${doc.id}-en` ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="mr-2">English</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              درباره مستندات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">چندزبانه</h3>
                <p className="text-sm text-gray-600">
                  مستندات به زبان‌های فارسی و انگلیسی ارائه می‌شود
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">جامع</h3>
                <p className="text-sm text-gray-600">
                  پوشش کامل تمام ماژول‌ها و قابلیت‌های سیستم
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">آماده دانلود</h3>
                <p className="text-sm text-gray-600">
                  فایل‌های PDF بهینه شده برای چاپ و مطالعه
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}