import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Template05Data {
  id: number;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  language: string;
  created_at: string;
}

const Template05View: React.FC = () => {
  const [template, setTemplate] = useState<Template05Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplate05Direct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct Template #05 fetch via dedicated endpoint
      const response = await fetch('/api/template05-direct', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📧 Direct SQL Query Result:', result);
      
      if (result.success && result.data) {
        setTemplate(result.data);
        toast({
          title: "✅ موفقیت",
          description: "Template #05 با موفقیت از دیتابیس بارگذاری شد",
        });
      } else {
        throw new Error('Template #05 در دیتابیس یافت نشد');
      }
    } catch (err) {
      console.error('❌ Error fetching Template #05:', err);
      setError(err.message);
      toast({
        title: "❌ خطا",
        description: `خطا در بارگذاری Template #05: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate05Direct();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری Template #05...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">❌ خطا در بارگذاری Template #05</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchTemplate05Direct} variant="outline">
              🔄 تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚠️ Template #05 یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">Template #05 در دیتابیس موجود نیست.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Template #05 - نمایش مستقیم</h1>
          <p className="text-gray-600 mt-1">مشاهده Template #05 مستقیماً از دیتابیس</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={fetchTemplate05Direct} variant="outline" size="sm">
            🔄 بروزرسانی
          </Button>
          <Badge variant="outline" className="text-green-700 bg-green-50">
            ✅ بارگذاری موفق
          </Badge>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 اطلاعات Template
            <Badge variant="secondary">ID: {template.id}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">نام Template:</label>
              <p className="text-gray-900 font-medium">{template.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">دسته‌بندی:</label>
              <p className="text-gray-900">{template.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">زبان:</label>
              <p className="text-gray-900">{template.language}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">تاریخ ایجاد:</label>
              <p className="text-gray-900">{new Date(template.created_at).toLocaleDateString('fa-IR')}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">موضوع ایمیل:</label>
            <p className="text-gray-900 bg-gray-50 p-2 rounded-md font-medium">{template.subject}</p>
          </div>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 پیش‌نمایش Template #05
            <Badge variant="outline" className="text-blue-700 bg-blue-50">
              HTML کامل
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div 
              dangerouslySetInnerHTML={{ __html: template.html_content }}
              className="email-template-preview"
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">📊 آمار محتوا:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">طول محتوا:</span>
                <span className="ml-2 font-medium">{template.html_content.length} کاراکتر</span>
              </div>
              <div>
                <span className="text-gray-600">شامل تلفن جدید:</span>
                <span className="ml-2 font-medium">
                  {template.html_content.includes('+964 770 999 6771') ? '✅ بله' : '❌ خیر'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">شامل وب‌سایت:</span>
                <span className="ml-2 font-medium">
                  {template.html_content.includes('www.momtazchem.com') ? '✅ بله' : '❌ خیر'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">شامل طراحی رنگی:</span>
                <span className="ml-2 font-medium">
                  {template.html_content.includes('gradient') || template.html_content.includes('background') ? '✅ بله' : '❌ خیر'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Template05View;