import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit2, Plus, Trash2, Eye, Copy, Send, Settings, FileText, Mail } from "lucide-react";

interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  language: string;
  createdBy: number;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  isActive: boolean;
}

export default function EmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/admin/email/templates'],
    queryFn: () => apiRequest('/api/admin/email/templates'),
  });

  // Fetch email categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['/api/admin/email/categories'],
    queryFn: () => apiRequest('/api/admin/email/categories'),
  });

  const categories: EmailCategory[] = categoriesResponse?.categories || [];

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: any) => apiRequest('/api/admin/email/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      setIsCreateOpen(false);
      toast({
        title: "✅ قالب ایمیل ایجاد شد",
        description: "قالب جدید با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطا در ایجاد قالب",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...templateData }: any) => apiRequest(`/api/admin/email/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "✅ قالب بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/email/templates/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: "✅ قالب حذف شد",
        description: "قالب ایمیل با موفقیت حذف شد",
      });
    },
  });

  // Toggle template status
  const toggleTemplateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest(`/api/admin/email/templates/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
    },
  });

  // Set default template
  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/email/templates/${id}/set-default`, {
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: "✅ قالب پیش‌فرض تنظیم شد",
        description: "این قالب به عنوان پیش‌فرض انتخاب شد",
      });
    },
  });

  const TemplateForm = ({ template, onSubmit, onClose }: {
    template?: EmailTemplate;
    onSubmit: (data: any) => void;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: template?.name || '',
      category: template?.category || '',
      subject: template?.subject || '',
      htmlContent: template?.htmlContent || '',
      textContent: template?.textContent || '',
      variables: template?.variables?.join(', ') || '',
      isActive: template?.isActive ?? true,
      language: template?.language || 'fa',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        variables: formData.variables.split(',').map(v => v.trim()).filter(Boolean),
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">نام قالب</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="نام قالب را وارد کنید"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">دسته‌بندی</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.categoryKey} value={cat.categoryKey}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="subject">موضوع ایمیل</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="موضوع ایمیل - می‌توانید از متغیرها استفاده کنید {{variable_name}}"
            required
          />
        </div>

        <div>
          <Label htmlFor="htmlContent">محتوای HTML</Label>
          <Textarea
            id="htmlContent"
            value={formData.htmlContent}
            onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
            placeholder="محتوای HTML ایمیل - از {{variable_name}} برای متغیرها استفاده کنید"
            rows={10}
            className="font-mono text-sm"
            required
          />
        </div>

        <div>
          <Label htmlFor="textContent">محتوای متنی (اختیاری)</Label>
          <Textarea
            id="textContent"
            value={formData.textContent}
            onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
            placeholder="محتوای متنی برای ایمیل‌های بدون HTML"
            rows={6}
          />
        </div>

        <div>
          <Label htmlFor="variables">متغیرهای قابل استفاده</Label>
          <Input
            id="variables"
            value={formData.variables}
            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            placeholder="customer_name, inquiry_number, product_name (با کاما جدا کنید)"
          />
          <p className="text-sm text-gray-500 mt-1">
            متغیرهایی که در محتوا قابل استفاده هستند. از فرمت {`{{variable_name}}`} استفاده کنید.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language">زبان</Label>
            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fa">فارسی</SelectItem>
                <SelectItem value="en">انگلیسی</SelectItem>
                <SelectItem value="ar">عربی</SelectItem>
                <SelectItem value="ku">کردی</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">فعال</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit">
            {template ? 'بروزرسانی' : 'ایجاد'} قالب
          </Button>
        </div>
      </form>
    );
  };

  const PreviewTemplate = ({ template }: { template: EmailTemplate }) => {
    const [variables, setVariables] = useState<Record<string, string>>({});

    useEffect(() => {
      // Set sample values for variables
      const sampleValues: Record<string, string> = {
        customer_name: 'آقای محمدی',
        inquiry_number: 'INQ-123456',
        product_name: 'محلول تصفیه آب A1',
        company_name: 'شیمی ممتاز',
        ticket_number: 'TKT-789012',
        priority: 'بالا',
        support_agent: 'تیم فنی',
        estimated_resolution: '24 ساعت',
        product_category: 'تصفیه آب',
        product_description: 'محلول پیشرفته تصفیه آب برای کاربردهای صنعتی',
        product_features: 'عملکرد بالا، قابلیت اطمینان، سازگار با محیط زیست',
      };
      
      const templateVariables: Record<string, string> = {};
      template.variables?.forEach(variable => {
        templateVariables[variable] = sampleValues[variable] || `{{${variable}}}`;
      });
      
      setVariables(templateVariables);
    }, [template]);

    const processContent = (content: string) => {
      let processed = content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, value);
      });
      return processed;
    };

    return (
      <div className="space-y-4" dir="rtl">
        <div>
          <h3 className="text-lg font-semibold mb-2">متغیرهای نمونه:</h3>
          <div className="grid grid-cols-2 gap-2">
            {template.variables?.map((variable) => (
              <div key={variable} className="flex items-center space-x-2">
                <Label className="text-sm">{variable}:</Label>
                <Input
                  size="sm"
                  value={variables[variable] || ''}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">موضوع:</h3>
          <div className="p-3 bg-gray-100 rounded-md">
            {processContent(template.subject)}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">پیش‌نمایش HTML:</h3>
          <div 
            className="border rounded-md p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: processContent(template.htmlContent) }}
          />
        </div>

        {template.textContent && (
          <div>
            <h3 className="text-lg font-semibold mb-2">محتوای متنی:</h3>
            <pre className="p-3 bg-gray-100 rounded-md whitespace-pre-wrap text-sm">
              {processContent(template.textContent)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری قالب‌های ایمیل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-8 h-8 text-blue-600" />
              مدیریت قالب‌های ایمیل
            </h1>
            <p className="text-gray-600 mt-2">
              مدیریت و ویرایش قالب‌های ایمیل‌های پاسخ به مشتریان
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                قالب جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ایجاد قالب ایمیل جدید</DialogTitle>
                <DialogDescription>
                  قالب جدیدی برای پاسخ‌های ایمیلی ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              <TemplateForm
                onSubmit={(data) => createTemplateMutation.mutate(data)}
                onClose={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                هیچ قالب ایمیلی یافت نشد
              </h3>
              <p className="text-gray-500 mb-4">
                برای شروع، اولین قالب ایمیل خود را ایجاد کنید
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                ایجاد قالب جدید
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((template: EmailTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            پیش‌فرض
                          </Badge>
                        )}
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        دسته‌بندی: {template.category} | زبان: {template.language} | 
                        استفاده شده: {template.usageCount} بار
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isPreviewOpen && selectedTemplate?.id === template.id} onOpenChange={(open) => {
                        setIsPreviewOpen(open);
                        if (!open) setSelectedTemplate(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>پیش‌نمایش قالب: {template.name}</DialogTitle>
                          </DialogHeader>
                          {selectedTemplate && <PreviewTemplate template={selectedTemplate} />}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isEditOpen && selectedTemplate?.id === template.id} onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setSelectedTemplate(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>ویرایش قالب: {template.name}</DialogTitle>
                          </DialogHeader>
                          {selectedTemplate && (
                            <TemplateForm
                              template={selectedTemplate}
                              onSubmit={(data) => updateTemplateMutation.mutate({ id: selectedTemplate.id, ...data })}
                              onClose={() => {
                                setIsEditOpen(false);
                                setSelectedTemplate(null);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTemplateMutation.mutate({ id: template.id, isActive: !template.isActive })}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>

                      {!template.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(template.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟')) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>موضوع:</strong> {template.subject}</p>
                    <div>
                      <strong>متغیرهای قابل استفاده:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables?.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {template.lastUsed && (
                      <p className="text-sm text-gray-500">
                        آخرین استفاده: {new Date(template.lastUsed).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}