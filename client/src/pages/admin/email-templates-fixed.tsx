import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Plus, Edit2, Eye, Copy, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: number;
  name: string;
  templateName?: string;
  subject: string;
  html_content: string;
  htmlContent?: string;
  text_content: string;
  textContent?: string;
  category: string;
  categoryName?: string;
  variables: string[];
  is_active: boolean;
  isActive?: boolean;
  is_default: boolean;
  isDefault?: boolean;
  language: string;
  created_by: number;
  createdBy?: number;
  usage_count: number;
  usageCount?: number;
  last_used: string | null;
  lastUsed?: string | null;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
}

const EmailTemplatesFixed: React.FC = () => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Direct API fetch with React Query
  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/admin/email/templates?cache_bust=${timestamp}&t=${Math.random()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('احراز هویت مورد نیاز است - لطفاً دوباره وارد شوید');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📧 Raw API Response:', { 
          dataType: typeof data, 
          isArray: Array.isArray(data), 
          length: data?.length, 
          keys: data && typeof data === 'object' ? Object.keys(data) : null 
        });
        
        if (!Array.isArray(data)) {
          if (data && data.success === false) {
            console.error('❌ API Error:', data);
            throw new Error(data.message || 'خطای API');
          }
          console.error('❌ Invalid data format:', data);
          throw new Error('فرمت داده نامعتبر دریافت شد');
        }

        return data.map((template: any) => ({
          id: template.id,
          name: template.name || template.templateName,
          templateName: template.templateName || template.name,
          subject: template.subject,
          html_content: template.html_content || template.htmlContent,
          htmlContent: template.htmlContent || template.html_content,
          text_content: template.text_content || template.textContent,
          textContent: template.textContent || template.text_content,
          category: template.category || template.categoryName,
          categoryName: template.categoryName || template.category,
          variables: template.variables || [],
          is_active: template.is_active !== false && template.isActive !== false,
          isActive: template.isActive !== false && template.is_active !== false,
          is_default: template.is_default || template.isDefault || false,
          isDefault: template.isDefault || template.is_default || false,
          language: template.language || 'fa',
          created_by: template.created_by || template.createdBy,
          createdBy: template.createdBy || template.created_by,
          usage_count: template.usage_count || template.usageCount || 0,
          usageCount: template.usageCount || template.usage_count || 0,
          last_used: template.last_used || template.lastUsed,
          lastUsed: template.lastUsed || template.last_used,
          created_at: template.created_at || template.createdAt,
          createdAt: template.createdAt || template.created_at,
          updated_at: template.updated_at || template.updatedAt,
          updatedAt: template.updatedAt || template.updated_at
        }));
      } catch (error) {
        console.error('❌ Error fetching templates:', error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.message?.includes('احراز هویت')) {
        // Redirect to login on auth error
        window.location.href = '/admin/login';
        return false;
      }
      return failureCount < 2;
    }
  });

  // Manual refresh function
  const handleRefresh = () => {
    // Clear query cache first
    queryClient.removeQueries({ queryKey: ['admin-email-templates'] });
    refetch();
    toast({
      title: "🔄 در حال بروزرسانی...",
      description: "قالب‌های ایمیل در حال بارگذاری مجدد",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت قالب‌های ایمیل</h1>
            <p className="text-gray-600">در حال بارگذاری قالب‌ها...</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت قالب‌های ایمیل</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
            <div className="text-red-600 mb-3">❌ خطا در دریافت قالب‌های ایمیل</div>
            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تلاش مجدد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const template05 = templates.find(t => t.name.includes('#05') || t.templateName?.includes('#05'));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت قالب‌های ایمیل</h1>
              <p className="text-gray-600">مدیریت و ویرایش قالب‌های ایمیل سیستم</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                بروزرسانی ({templates.length})
              </Button>
              <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                قالب جدید
              </Button>
            </div>
          </div>
        </div>

        {/* Template #05 Highlight */}
        {template05 && (
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Template #05 - Momtaz Chemical Follow-up Response
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    زیبا شده ✨
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 mb-2">
                      ✅ شماره تلفن جدید: +964 770 999 6771
                    </p>
                    <p className="text-sm text-green-700 mb-2">
                      ✅ آدرس سایت: www.momtazchem.com
                    </p>
                    <p className="text-sm text-green-700">
                      ✅ نوارهای رنگی "پاسخ ما" و "درخواست شما"
                    </p>
                  </div>
                  <Button 
                    onClick={() => setPreviewTemplate(template05)} 
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    مشاهده
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {template.name || template.templateName}
                    </CardTitle>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>موضوع:</strong> {template.subject}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>دسته‌بندی:</strong> {template.category || template.categoryName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>استفاده:</strong> {template.usage_count || template.usageCount || 0} بار
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  پیش‌نمایش: {previewTemplate.name || previewTemplate.templateName}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6">
                <div 
                  className="border rounded-lg p-4 bg-gray-50"
                  dangerouslySetInnerHTML={{ 
                    __html: previewTemplate.html_content || previewTemplate.htmlContent || 'محتوای HTML موجود نیست' 
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesFixed;