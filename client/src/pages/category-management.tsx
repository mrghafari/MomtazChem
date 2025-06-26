import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, ArrowLeft, Eye, EyeOff, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Bilingual translations
const translations = {
  en: {
    // Page titles and navigation
    categoryManagement: "Category Management",
    backToAdmin: "Back to Admin",
    createCategory: "Create Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    
    // Form fields
    categoryName: "Category Name",
    slug: "Slug",
    description: "Description",
    imageUrl: "Image URL",
    parentCategory: "Parent Category",
    noParent: "No Parent",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    displayOrder: "Display Order",
    metaTitle: "Meta Title",
    metaDescription: "Meta Description",
    
    // Actions
    create: "Create",
    update: "Update",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    
    // Validation messages
    nameRequired: "Category name must be at least 2 characters",
    slugRequired: "Slug must be at least 2 characters",
    
    // Placeholders
    namePlaceholder: "Enter category name",
    slugPlaceholder: "enter-category-slug",
    descriptionPlaceholder: "Enter category description",
    imageUrlPlaceholder: "https://example.com/image.jpg",
    metaTitlePlaceholder: "SEO title for this category",
    metaDescriptionPlaceholder: "SEO description for this category",
    
    // Table headers
    name: "Name",
    parent: "Parent",
    order: "Order",
    actions: "Actions",
    
    // Status messages
    createSuccess: "Category created successfully",
    updateSuccess: "Category updated successfully",
    deleteSuccess: "Category deleted successfully",
    createError: "Failed to create category",
    updateError: "Failed to update category",
    deleteError: "Failed to delete category",
    
    // Confirmation
    deleteConfirm: "Are you sure you want to delete this category?",
    
    // Language switcher
    switchLanguage: "العربية",
    language: "Language"
  },
  ar: {
    // Page titles and navigation
    categoryManagement: "إدارة الفئات",
    backToAdmin: "العودة إلى الإدارة",
    createCategory: "إنشاء فئة",
    editCategory: "تعديل الفئة",
    deleteCategory: "حذف الفئة",
    
    // Form fields
    categoryName: "اسم الفئة",
    slug: "الرابط المختصر",
    description: "الوصف",
    imageUrl: "رابط الصورة",
    parentCategory: "الفئة الأساسية",
    noParent: "بدون فئة أساسية",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    displayOrder: "ترتيب العرض",
    metaTitle: "عنوان السيو",
    metaDescription: "وصف السيو",
    
    // Actions
    create: "إنشاء",
    update: "تحديث",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    
    // Validation messages
    nameRequired: "اسم الفئة يجب أن يكون على الأقل حرفين",
    slugRequired: "الرابط المختصر يجب أن يكون على الأقل حرفين",
    
    // Placeholders
    namePlaceholder: "أدخل اسم الفئة",
    slugPlaceholder: "ادخل-رابط-الفئة",
    descriptionPlaceholder: "أدخل وصف الفئة",
    imageUrlPlaceholder: "https://example.com/image.jpg",
    metaTitlePlaceholder: "عنوان السيو لهذه الفئة",
    metaDescriptionPlaceholder: "وصف السيو لهذه الفئة",
    
    // Table headers
    name: "الاسم",
    parent: "الفئة الأساسية",
    order: "الترتيب",
    actions: "الإجراءات",
    
    // Status messages
    createSuccess: "تم إنشاء الفئة بنجاح",
    updateSuccess: "تم تحديث الفئة بنجاح",
    deleteSuccess: "تم حذف الفئة بنجاح",
    createError: "فشل في إنشاء الفئة",
    updateError: "فشل في تحديث الفئة",
    deleteError: "فشل في حذف الفئة",
    
    // Confirmation
    deleteConfirm: "هل أنت متأكد من حذف هذه الفئة؟",
    
    // Language switcher
    switchLanguage: "English",
    language: "اللغة"
  }
};

const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.number().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().min(0).default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type CategoryForm = z.infer<typeof categoryFormSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  isActive: boolean;
  displayOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // Get current translations
  const t = translations[language];

  // Toggle language function
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  // Fetch categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      parentId: undefined,
      isActive: true,
      displayOrder: 0,
      metaTitle: "",
      metaDescription: "",
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => 
      fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: t.createSuccess,
        description: t.createSuccess,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.createError,
        description: error.message || t.createError,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryForm }) => 
      fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: t.updateSuccess,
        description: t.updateSuccess,
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.updateError,
        description: error.message || t.updateError,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: t.deleteSuccess,
        description: t.deleteSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.deleteError,
        description: error.message || t.deleteError,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      parentId: category.parentId || undefined,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t.deleteConfirm)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Get parent categories for dropdown
  const categoriesArray = Array.isArray(categories) ? categories as Category[] : [];
  const parentCategories = categoriesArray.filter((cat: Category) => !cat.parentId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">خطا در بارگذاری داده‌ها</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            مدیریت دسته‌بندی محصولات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            ایجاد، ویرایش و مدیریت دسته‌بندی‌های محصولات
          </p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewCategory} className="bg-[#a0c514] hover:bg-[#8fb012]">
                <Plus className="w-4 h-4 mr-2" />
                دسته‌بندی جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام دسته‌بندی</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="نام دسته‌بندی را وارد کنید"
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingCategory) {
                                  form.setValue("slug", generateSlug(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نامک (Slug)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="category-slug" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="توضیحات دسته‌بندی..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>دسته‌بندی والد</FormLabel>
                          <Select
                            value={field.value?.toString() || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select parent category (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Parent</SelectItem>
                              {parentCategories.map((category: Category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ترتیب نمایش</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>آدرس تصویر</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان SEO</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="عنوان برای موتورهای جستجو" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>فعال</FormLabel>
                            <div className="text-sm text-gray-600">
                              دسته‌بندی فعال در سایت نمایش داده می‌شود
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات SEO</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="توضیحات برای موتورهای جستجو..." rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      className="bg-[#a0c514] hover:bg-[#8fb012]"
                    >
                      {createCategoryMutation.isPending || updateCategoryMutation.isPending
                        ? "در حال پردازش..."
                        : editingCategory
                        ? "بروزرسانی"
                        : "ایجاد"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            بازگشت
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست دسته‌بندی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>نامک</TableHead>
                <TableHead>دسته‌بندی والد</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesArray.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-gray-600">{category.slug}</TableCell>
                  <TableCell>
                    {category.parentId
                      ? categoriesArray.find((c: Category) => c.id === category.parentId)?.name || "-"
                      : "-"}
                  </TableCell>
                  <TableCell>{category.displayOrder}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? (
                        <><Eye className="w-3 h-3 mr-1" />فعال</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" />غیرفعال</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(category.createdAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {categoriesArray.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              هیچ دسته‌بندی‌ای یافت نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}