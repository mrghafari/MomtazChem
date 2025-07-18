import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, MessageSquare, Hash, Tags, Calendar, User, BarChart3, Copy, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Zod schemas for form validation
const templateCategorySchema = z.object({
  categoryName: z.string().min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد"),
  categoryDescription: z.string().optional(),
  systemUsage: z.string().min(2, "کاربری سیستم الزامی است"),
  displayOrder: z.number().min(0).default(0)
});

const templateSchema = z.object({
  categoryId: z.number({ required_error: "انتخاب دسته‌بندی الزامی است" }),
  templateName: z.string().min(2, "نام قالب باید حداقل ۲ کاراکتر باشد"),
  templateContent: z.string().min(10, "محتوای قالب باید حداقل ۱۰ کاراکتر باشد"),
  variables: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  createdBy: z.string().default("admin")
});

type TemplateCategory = {
  id: number;
  categoryNumber: number;
  categoryName: string;
  categoryDescription?: string;
  systemUsage: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type SmsTemplate = {
  id: number;
  categoryId: number;
  templateNumber: number;
  templateName: string;
  templateContent: string;
  variables?: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
};

export default function SmsTemplateManagement() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch template categories
  const { data: categoriesData = { data: [] }, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/admin/sms/template-categories"],
    queryFn: () => apiRequest("/api/admin/sms/template-categories")
  });

  // Fetch all templates
  const { data: templatesData = { data: [] }, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/admin/sms/templates"],
    queryFn: () => apiRequest("/api/admin/sms/templates")
  });

  // Extract arrays from API responses
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  const templates = Array.isArray(templatesData) ? templatesData : (templatesData?.data || []);

  // Category form
  const categoryForm = useForm<z.infer<typeof templateCategorySchema>>({
    resolver: zodResolver(templateCategorySchema),
    defaultValues: {
      categoryName: "",
      categoryDescription: "",
      systemUsage: "",
      displayOrder: 0
    }
  });

  // Template form
  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      categoryId: 0,
      templateName: "",
      templateContent: "",
      variables: [],
      isDefault: false,
      createdBy: "admin"
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof templateCategorySchema>) =>
      apiRequest("/api/admin/sms/template-categories", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/template-categories"] });
      setShowCategoryDialog(false);
      categoryForm.reset();
      toast({ title: "موفقیت", description: "دسته‌بندی قالب ایجاد شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در ایجاد دسته‌بندی", variant: "destructive" });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof templateCategorySchema>> }) =>
      apiRequest(`/api/admin/sms/template-categories/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/template-categories"] });
      setShowCategoryDialog(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: "موفقیت", description: "دسته‌بندی قالب بروزرسانی شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در بروزرسانی دسته‌بندی", variant: "destructive" });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/sms/template-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/template-categories"] });
      toast({ title: "موفقیت", description: "دسته‌بندی قالب حذف شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در حذف دسته‌بندی", variant: "destructive" });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: z.infer<typeof templateSchema>) =>
      apiRequest("/api/admin/sms/templates", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/templates"] });
      setShowTemplateDialog(false);
      templateForm.reset();
      toast({ title: "موفقیت", description: "قالب ایجاد شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در ایجاد قالب", variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof templateSchema>> }) =>
      apiRequest(`/api/admin/sms/templates/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/templates"] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({ title: "موفقیت", description: "قالب بروزرسانی شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در بروزرسانی قالب", variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/sms/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/templates"] });
      toast({ title: "موفقیت", description: "قالب حذف شد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در حذف قالب", variant: "destructive" });
    }
  });

  // Toggle category status mutation
  const toggleCategoryStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest(`/api/admin/sms/template-categories/${id}/toggle-status`, { 
        method: "PATCH", 
        body: { isActive } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/template-categories"] });
      toast({ title: "موفقیت", description: "وضعیت دسته‌بندی تغییر کرد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در تغییر وضعیت دسته‌بندی", variant: "destructive" });
    }
  });

  // Toggle template status mutation
  const toggleTemplateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest(`/api/admin/sms/templates/${id}/toggle-status`, { 
        method: "PATCH", 
        body: { isActive } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/templates"] });
      toast({ title: "موفقیت", description: "وضعیت قالب تغییر کرد" });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در تغییر وضعیت قالب", variant: "destructive" });
    }
  });

  // Handle category form submission
  const onCategorySubmit = (data: z.infer<typeof templateCategorySchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Get next template number for category
  const getNextTemplateNumber = (categoryId: number): number => {
    const categoryTemplates = templates.filter((t: SmsTemplate) => t.categoryId === categoryId);
    const maxNumber = categoryTemplates.length > 0 
      ? Math.max(...categoryTemplates.map(t => t.templateNumber))
      : 0;
    return maxNumber + 1;
  };

  // Handle template form submission
  const onTemplateSubmit = (data: z.infer<typeof templateSchema>) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      // Automatically assign next template number for new templates
      const templateNumber = getNextTemplateNumber(data.categoryId);
      createTemplateMutation.mutate({ ...data, templateNumber });
    }
  };

  // Handle edit category
  const handleEditCategory = (category: TemplateCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription || "",
      systemUsage: category.systemUsage,
      displayOrder: category.displayOrder
    });
    setShowCategoryDialog(true);
  };

  // Handle edit template
  const handleEditTemplate = (template: SmsTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      categoryId: template.categoryId,
      templateName: template.templateName,
      templateContent: template.templateContent,
      variables: template.variables || [],
      isDefault: template.isDefault,
      createdBy: template.createdBy || "admin"
    });
    setShowTemplateDialog(true);
  };

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
  };

  // Preview template with variables
  const previewTemplate = (content: string, variables: Record<string, string>): string => {
    let preview = content;
    Object.entries(variables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return preview;
  };

  // Filter templates by selected category
  const filteredTemplates = selectedCategory 
    ? templates.filter((t: SmsTemplate) => t.categoryId === selectedCategory)
    : templates;

  if (categoriesLoading || templatesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مدیریت قالب‌های پیامک</h2>
          <p className="text-gray-600">مدیریت دسته‌بندی‌ها و قالب‌های پیامک سیستم</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setEditingCategory(null); categoryForm.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                دسته‌بندی جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
                </DialogTitle>
                <DialogDescription>
                  دسته‌بندی جدید برای سازماندهی قالب‌های پیامک ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="categoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام دسته‌بندی</FormLabel>
                        <FormControl>
                          <Input placeholder="نام دسته‌بندی را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="categoryDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea placeholder="توضیحات دسته‌بندی..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="systemUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کاربری سیستم</FormLabel>
                        <FormControl>
                          <Input placeholder="temporary_orders, delivery_verification, ..." {...field} />
                        </FormControl>
                        <FormDescription>
                          شناسه یکتا برای استفاده سیستمی
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ترتیب نمایش</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {editingCategory ? "بروزرسانی" : "ایجاد"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTemplate(null); templateForm.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                قالب جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "ویرایش قالب" : "ایجاد قالب جدید"}
                </DialogTitle>
                <DialogDescription>
                  قالب پیامک جدید برای استفاده در سیستم ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                  <FormField
                    control={templateForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: TemplateCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.categoryNumber}. {category.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {!editingTemplate && field.value && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                              {getNextTemplateNumber(field.value)}
                            </div>
                            <span className="text-sm text-blue-700">
                              شماره قالب جدید: {getNextTemplateNumber(field.value)}
                            </span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={templateForm.control}
                    name="templateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام قالب</FormLabel>
                        <FormControl>
                          <Input placeholder="نام قالب را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={templateForm.control}
                    name="templateContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>محتوای قالب</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="محتوای پیامک را وارد کنید. از {{variable_name}} برای متغیرها استفاده کنید"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          متغیرهای موجود: {extractVariables(field.value).join(', ') || "هیچ متغیری یافت نشد"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={templateForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">قالب پیش‌فرض</FormLabel>
                          <FormDescription>
                            این قالب به عنوان پیش‌فرض برای دسته‌بندی استفاده شود
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      {editingTemplate ? "بروزرسانی" : "ایجاد"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select 
              value={selectedCategory?.toString() || "all"} 
              onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="فیلتر بر اساس دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map((category: TemplateCategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    #{category.categoryNumber} {category.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTemplates.map((template: SmsTemplate) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shrink-0">
                        {template.templateNumber}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.templateName}</CardTitle>
                        <p className="text-sm text-blue-600 font-medium">قالب شماره {template.templateNumber}</p>
                      </div>
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">پیش‌فرض</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(template.templateContent)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-blue-600">
                    {template.categoryName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">محتوای قالب:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {template.templateContent}
                      </p>
                    </div>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">متغیرها:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Template Status Toggle */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                        <span className="text-sm text-gray-600">وضعیت قالب</span>
                      </div>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={(checked) => 
                          toggleTemplateStatusMutation.mutate({ id: template.id, isActive: checked })
                        }
                        disabled={toggleTemplateStatusMutation.isPending}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{template.usageCount} استفاده</span>
                      </div>
                      {template.createdBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{template.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      </div>
    </div>
  );
}