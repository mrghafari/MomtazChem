import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, ArrowLeft, Globe } from "lucide-react";

// Translations
const translations = {
  en: {
    title: "Product Category Management",
    subtitle: "Create, edit and manage product categories",
    newCategory: "New Category",
    categoryName: "Category Name",
    slug: "Slug",
    description: "Description",
    imageUrl: "Image URL",
    parentCategory: "Parent Category",
    isActive: "Active",
    displayOrder: "Display Order",
    metaTitle: "Meta Title",
    metaDescription: "Meta Description",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    actions: "Actions",
    createSuccess: "Category created successfully",
    updateSuccess: "Category updated successfully",
    deleteSuccess: "Category deleted successfully",
    createError: "Error creating category",
    updateError: "Error updating category",
    deleteError: "Error deleting category",
    deleteConfirm: "Are you sure you want to delete this category?",
    selectParent: "Select parent category",
    none: "None",
    active: "Active",
    inactive: "Inactive",
    createdAt: "Created At",
    updatedAt: "Updated At",
    enterName: "Enter category name",
    enterSlug: "Enter slug",
    enterDescription: "Enter description",
    enterImageUrl: "Enter image URL",
    enterMetaTitle: "Enter meta title",
    enterMetaDescription: "Enter meta description",
    createCategoryTitle: "Create New Category",
    editCategoryTitle: "Edit Category",
    backToAdmin: "Back to Admin"
  },
  ar: {
    title: "إدارة فئات المنتجات",
    subtitle: "إنشاء وتعديل وإدارة فئات المنتجات",
    newCategory: "فئة جديدة",
    categoryName: "اسم الفئة",
    slug: "الرابط المختصر",
    description: "الوصف",
    imageUrl: "رابط الصورة",
    parentCategory: "الفئة الأب",
    isActive: "نشط",
    displayOrder: "ترتيب العرض",
    metaTitle: "عنوان الصفحة",
    metaDescription: "وصف الصفحة",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    actions: "الإجراءات",
    createSuccess: "تم إنشاء الفئة بنجاح",
    updateSuccess: "تم تحديث الفئة بنجاح",
    deleteSuccess: "تم حذف الفئة بنجاح",
    createError: "خطأ في إنشاء الفئة",
    updateError: "خطأ في تحديث الفئة",
    deleteError: "خطأ في حذف الفئة",
    deleteConfirm: "هل أنت متأكد من حذف هذه الفئة؟",
    selectParent: "اختر الفئة الأب",
    none: "لا شيء",
    active: "نشط",
    inactive: "غير نشط",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "تاريخ التحديث",
    enterName: "أدخل اسم الفئة",
    enterSlug: "أدخل الرابط المختصر",
    enterDescription: "أدخل الوصف",
    enterImageUrl: "أدخل رابط الصورة",
    enterMetaTitle: "أدخل عنوان الصفحة",
    enterMetaDescription: "أدخل وصف الصفحة",
    createCategoryTitle: "إنشاء فئة جديدة",
    editCategoryTitle: "تعديل الفئة",
    backToAdmin: "العودة إلى لوحة الإدارة"
  }
};

// Form schema
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.number().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
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
          <div className="text-lg">{language === 'en' ? 'Loading...' : 'جارٍ التحميل...'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{language === 'en' ? 'Error loading data' : 'خطأ في تحميل البيانات'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleLanguage}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'عربي' : 'English'}
          </Button>
          <Button
            onClick={() => setLocation("/admin")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToAdmin}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCategory} className="bg-[#a0c514] hover:bg-[#8fb012]">
              <Plus className="w-4 h-4 mr-2" />
              {t.newCategory}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t.editCategoryTitle : t.createCategoryTitle}
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
                        <FormLabel>{t.categoryName}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.enterName}
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
                        <FormLabel>{t.slug}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.enterSlug} />
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
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t.enterDescription} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.imageUrl}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.enterImageUrl} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.parentCategory}</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.selectParent} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.none}</SelectItem>
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
                        <FormLabel>{t.displayOrder}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
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
                          <FormLabel>{t.isActive}</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.metaTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.enterMetaTitle} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.metaDescription}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t.enterMetaDescription} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                    {t.save}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.categoryName}</TableHead>
                <TableHead>{t.slug}</TableHead>
                <TableHead>{t.parentCategory}</TableHead>
                <TableHead>{t.isActive}</TableHead>
                <TableHead>{t.displayOrder}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesArray.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    {category.parentId 
                      ? categoriesArray.find((c: Category) => c.id === category.parentId)?.name || "-"
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? t.active : t.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.displayOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                        {t.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}