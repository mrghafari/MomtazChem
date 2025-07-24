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
import { useAuth } from '@/hooks/useAuth';

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

// Template categories and info for centralized system
const TEMPLATE_CATEGORIES = {
  support: { name: 'پشتیبانی فنی', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  inquiry: { name: 'استعلامات', color: 'bg-green-50 border-green-200 text-green-800' },
  admin: { name: 'مدیریتی', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  notification: { name: 'اطلاع‌رسانی', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  inventory: { name: 'موجودی', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  payment: { name: 'پرداخت', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  security: { name: 'امنیتی', color: 'bg-red-50 border-red-200 text-red-800' }
};

// All 17 templates information from EMAIL_TEMPLATES_GUIDE.md
const TEMPLATE_REGISTRY = {
  '#01': { category: 'support', ref: 'TPL-001', usage: 'Technical Support Response' },
  '#02': { category: 'support', ref: 'TPL-002', usage: 'Product Information Response' },
  '#03': { category: 'inquiry', ref: 'TPL-003', usage: 'General Inquiry Response' },
  '#04': { category: 'inquiry', ref: 'TPL-004', usage: 'قالب پاسخ استعلام - طراحی زیبا و حرفه‌ای' },
  '#05': { category: 'inquiry', ref: 'TPL-005', usage: 'Momtaz Chemical Follow-up Response ⭐' },
  '#06': { category: 'admin', ref: 'TPL-006', usage: 'Password Management Template' },
  '#07': { category: 'notification', ref: 'TPL-007', usage: 'Product Inquiry Admin Notification' },
  '#08': { category: 'notification', ref: 'TPL-008', usage: 'Customer Inquiry Confirmation' },
  '#09': { category: 'notification', ref: 'TPL-009', usage: 'Sales Inquiry Notification' },
  '#10': { category: 'notification', ref: 'TPL-010', usage: 'Quote Request Notification' },
  '#11': { category: 'admin', ref: 'TPL-011', usage: 'Generated Password Notification (Persian)' },
  '#12': { category: 'admin', ref: 'TPL-012', usage: 'Admin Password Reset (Persian)' },
  '#13': { category: 'inventory', ref: 'TPL-013', usage: 'Low Stock Alert (Universal Service)' },
  '#14': { category: 'payment', ref: 'TPL-014', usage: 'Payment Confirmation' },
  '#15': { category: 'notification', ref: 'TPL-015', usage: 'System Notification' },
  '#16': { category: 'security', ref: 'TPL-016', usage: 'Security Alert' },
  '#17': { category: 'inventory', ref: 'TPL-017', usage: 'Comprehensive Inventory Alert System ⭐' }
};

const EmailTemplatesFixed: React.FC = () => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { user } = useAuth();
  
  // Direct API fetch with React Query
  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/email/templates'],
    enabled: !!user
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
          {templates.map((template) => {
            const isTemplate05 = template.name === '#05 - Momtaz Chemical Follow-up Response';
            
            return (
              <Card 
                key={template.id} 
                className={`hover:shadow-md transition-shadow ${
                  isTemplate05 ? 'border-green-300 bg-green-50 shadow-lg' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-lg mb-1 ${isTemplate05 ? 'text-green-800' : ''}`}>
                        {template.name || template.templateName}
                        {isTemplate05 && (
                          <span className="block text-sm text-green-600 font-normal mt-1">
                            ⭐ شامل بخش‌های "پاسخ ما" و "درخواست شما"
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                        {isTemplate05 && (
                          <Badge variant="default" className="bg-green-600 text-white">
                            ✨ Template #05 زیبا
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className={isTemplate05 ? 'hover:bg-green-100' : ''}
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
                {isTemplate05 && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-bold text-green-800 mb-2">✨ ویژگی‌های Template #05:</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs text-green-700">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">✅</span>
                        <span>بخش "پاسخ ما" با پس‌زمینه سبز</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600">✅</span>
                        <span>بخش "درخواست شما" با پس‌زمینه آبی</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-600">✅</span>
                        <span>شماره تلفن: +964 770 999 6771</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-purple-600">✅</span>
                        <span>وب‌سایت: www.momtazchem.com</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mb-2">
                  <strong>موضوع:</strong> {template.subject}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>دسته‌بندی:</strong> {template.category || template.categoryName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>استفاده:</strong> {template.usage_count || template.usageCount || 0} بار
                </p>
                
                {isTemplate05 && (
                  <div className="mt-3">
                    <a 
                      href="/admin/template05-static" 
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      🎨 مشاهده کامل Template #05
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
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