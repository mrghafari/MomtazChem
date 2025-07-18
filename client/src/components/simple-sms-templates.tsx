import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Plus, Copy, MessageSquare, Tag, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Types
interface SmsTemplate {
  id: number;
  categoryId: number;
  templateNumber: number;
  templateName: string;
  templateContent: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsed: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  categoryName: string;
}

interface TemplateCategory {
  id: number;
  categoryNumber: number;
  categoryName: string;
  categoryDescription: string;
  systemUsage: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const templateSchema = z.object({
  categoryId: z.number().min(1, "انتخاب دسته‌بندی الزامی است"),
  templateName: z.string().min(1, "نام قالب الزامی است"),
  templateContent: z.string().min(1, "محتوای قالب الزامی است"),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
  createdBy: z.string().default("admin")
});

export default function SimpleSmsTemplates() {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
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

  // Filter templates based on selected category
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter((t: SmsTemplate) => t.categoryId === parseInt(selectedCategory));

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

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: z.infer<typeof templateSchema>) =>
      apiRequest("/api/admin/sms/templates", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/templates"] });
      setShowTemplateDialog(false);
      templateForm.reset();
      toast({ title: "موفقیت", description: "قالب پیامک ایجاد شد" });
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
    // Extract variables from template content
    const extractedVars = extractVariables(data.templateContent);
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({ 
        id: editingTemplate.id, 
        data: { ...data, variables: extractedVars }
      });
    } else {
      // Automatically assign next template number for new templates
      const templateNumber = getNextTemplateNumber(data.categoryId);
      createTemplateMutation.mutate({ 
        ...data, 
        templateNumber, 
        variables: extractedVars 
      });
    }
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

  // Copy template content to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "کپی شد", description: "محتوای قالب کپی شد" });
  };

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
          <h2 className="text-2xl font-bold text-gray-900">قالب‌های پیامک سیستم</h2>
          <p className="text-gray-600">مدیریت و ویرایش قالب‌های پیامک ({templates.length} قالب)</p>
        </div>
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
                قالب پیامک جدید برای سیستم ایجاد کنید
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
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: TemplateCategory) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              #{category.categoryNumber} {category.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                        <Input placeholder="نام قالب پیامک" {...field} />
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
                          placeholder="محتوای پیامک (از {{variable_name}} برای متغیرها استفاده کنید)"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        متغیرهای شناسایی شده: {extractVariables(field.value || "").join(", ") || "هیچ"}
                      </p>
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

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="فیلتر بر اساس دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌بندی‌ها ({templates.length})</SelectItem>
            {categories.map((category: TemplateCategory) => {
              const count = templates.filter((t: SmsTemplate) => t.categoryId === category.id).length;
              return (
                <SelectItem key={category.id} value={category.id.toString()}>
                  #{category.categoryNumber} {category.categoryName} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template: SmsTemplate) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg w-14 h-14 flex items-center justify-center font-bold text-xl shrink-0">
                    {template.templateNumber}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.templateName}</CardTitle>
                    <p className="text-sm text-blue-600 font-medium">
                      #{template.categoryNumber || template.templateNumber} • {template.categoryName}
                    </p>
                  </div>
                  {template.isDefault && (
                    <Badge variant="default" className="text-xs">پیش‌فرض</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(template.templateContent)}
                    title="کپی محتوا"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    title="ویرایش"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                    disabled={deleteTemplateMutation.isPending}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-2 text-gray-700">محتوای قالب:</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {template.templateContent}
                  </p>
                </div>
                
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      متغیرها ({template.variables.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{template.usageCount} استفاده</span>
                  </div>
                  {template.createdBy && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>توسط: {template.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">قالبی یافت نشد</h3>
          <p className="text-gray-500">در دسته‌بندی انتخابی قالبی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}