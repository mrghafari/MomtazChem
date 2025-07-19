import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Plus, Edit2, Eye, Copy, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  category: string;
  variables: string[];
  is_active: boolean;
  is_default: boolean;
  language: string;
  created_by: number;
  usage_count: number;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

const EmailTemplates: React.FC = () => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    category: '',
    variables: '',
    is_active: true,
    language: 'fa',
    created_by: 15
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    staleTime: 30000,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest('/api/email-templates', {
        method: 'POST',
        body: templateData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "قالب ایمیل ایجاد شد",
        description: "قالب جدید با موفقیت اضافه شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد قالب",
        description: error.message || "مشکلی در ایجاد قالب پیش آمد",
        variant: "destructive",
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: any) => {
      return apiRequest(`/api/email-templates/${id}`, {
        method: 'PUT',
        body: templateData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "قالب به‌روزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی",
        description: error.message || "مشکلی در به‌روزرسانی پیش آمد",
        variant: "destructive",
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/email-templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "قالب حذف شد",
        description: "قالب با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در حذف",
        description: error.message || "مشکلی در حذف قالب پیش آمد",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      category: '',
      variables: '',
      is_active: true,
      language: 'fa',
      created_by: 15
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      category: template.category,
      variables: template.variables?.join(', ') || '',
      is_active: template.is_active,
      language: template.language || 'fa',
      created_by: template.created_by || 15
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData = {
      ...formData,
      variables: formData.variables.split(',').map(v => v.trim()).filter(v => v)
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleCopy = async (template: EmailTemplate) => {
    try {
      await navigator.clipboard.writeText(`Template: ${template.name}`);
      toast({
        title: "کپی شد",
        description: "نام قالب کپی شد",
      });
    } catch (error) {
      toast({
        title: "خطا در کپی",
        description: "نتوانستم نام قالب را کپی کنم",
        variant: "destructive",
      });
    }
  };

  const predefinedTemplates = [
    {
      templateName: "پیام تأیید استعلام",
      category: "inquiry_confirmation",
      description: "قالب پیام تأیید برای استعلام‌های مشتریان",
      variables: ["customer_name", "inquiry_number", "inquiry_subject", "response_time"]
    },
    {
      templateName: "پیگیری استعلام",
      category: "inquiry_followup", 
      description: "قالب پیگیری برای استعلام‌های در انتظار پاسخ",
      variables: ["customer_name", "inquiry_number", "days_pending", "contact_info"]
    },
    {
      templateName: "تأیید سفارش",
      category: "order_confirmation",
      description: "قالب تأیید سفارش برای مشتریان",
      variables: ["customer_name", "order_number", "total_amount", "delivery_date"]
    },
    {
      templateName: "هشدار موجودی",
      category: "inventory_alert",
      description: "قالب هشدار برای کمبود موجودی محصولات",
      variables: ["product_name", "current_stock", "minimum_threshold", "supplier_info"]
    },
    {
      templateName: "بازنشانی رمز عبور",
      category: "password_reset",
      description: "قالب بازنشانی رمز عبور برای مشتریان",
      variables: ["customer_name", "reset_link", "expiry_time", "support_contact"]
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">قالب‌های ایمیل</h1>
          <p className="text-gray-600 mt-2">مدیریت قالب‌های ایمیل با شماره‌گذاری منحصر به فرد</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          قالب جدید
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">قالب‌های موجود</TabsTrigger>
          <TabsTrigger value="predefined">قالب‌های پیش‌فرض</TabsTrigger>
          <TabsTrigger value="variables">متغیرهای قابل استفاده</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((template: EmailTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {template.name.includes('#') ? template.name.split(' ')[0] : `#${template.id}`}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewTemplate(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">استفاده شده: {template.usage_count} بار</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">دسته‌بندی:</span>
                      <Badge variant="secondary" className="ml-2">{template.category}</Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">موضوع:</span>
                      <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                    </div>
                    {template.variables && template.variables.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">متغیرها:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.variables.map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedTemplates.map((template, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.templateName}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">دسته‌بندی:</span>
                      <Badge variant="secondary" className="ml-2">{template.category}</Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">متغیرهای پیشنهادی:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable, vIndex) => (
                          <Badge key={vIndex} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFormData({
                          name: template.templateName,
                          subject: `موضوع - ${template.templateName}`,
                          html_content: '',
                          text_content: '',
                          category: template.category,
                          variables: template.variables.join(', '),
                          is_active: true,
                          language: 'fa',
                          created_by: 15
                        });
                        setIsCreating(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      ایجاد از این قالب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>متغیرهای قابل استفاده در قالب‌ها</CardTitle>
              <p className="text-gray-600">این متغیرها در زمان ارسال ایمیل با مقادیر واقعی جایگزین می‌شوند</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'customer_name', desc: 'نام مشتری' },
                  { name: 'inquiry_number', desc: 'شماره استعلام' },
                  { name: 'inquiry_subject', desc: 'موضوع استعلام' },
                  { name: 'inquiry_category', desc: 'دسته‌بندی استعلام' },
                  { name: 'response_text', desc: 'متن پاسخ' },
                  { name: 'order_number', desc: 'شماره سفارش' },
                  { name: 'total_amount', desc: 'مبلغ کل' },
                  { name: 'product_name', desc: 'نام محصول' },
                  { name: 'current_stock', desc: 'موجودی فعلی' },
                  { name: 'reset_link', desc: 'لینک بازنشانی' },
                  { name: 'expiry_time', desc: 'زمان انقضا' },
                  { name: 'contact_info', desc: 'اطلاعات تماس' }
                ].map((variable, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                    <p className="text-sm text-gray-600 mt-1">{variable.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Form Modal */}
      {(isCreating || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingTemplate ? 'ویرایش قالب' : 'ایجاد قالب جدید'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">نام قالب</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">موضوع ایمیل</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium mb-2">متغیرها (با کاما جدا کنید)</label>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                    placeholder="customer_name, inquiry_number, response_text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">محتوای HTML</label>
                  <Textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">محتوای متنی (اختیاری)</label>
                  <Textarea
                    value={formData.text_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                    rows={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">قالب فعال باشد</span>
                  </label>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingTemplate(null);
                        resetForm();
                      }}
                    >
                      لغو
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingTemplate ? 'به‌روزرسانی' : 'ایجاد'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">پیش‌نمایش قالب: {previewTemplate.name}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">موضوع:</h3>
                  <p className="bg-gray-50 p-3 rounded">{previewTemplate.subject}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">محتوای HTML:</h3>
                  <div 
                    className="border p-4 rounded bg-white"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.html_content }}
                  />
                </div>

                {previewTemplate.text_content && (
                  <div>
                    <h3 className="font-medium text-gray-700">محتوای متنی:</h3>
                    <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {previewTemplate.text_content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;