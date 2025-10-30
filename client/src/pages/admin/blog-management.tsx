import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { marked } from "marked";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  FileText,
  Save,
} from "lucide-react";
import type { BlogPostWithTranslations } from "@shared/blog-schema";

// Form validation schema
const blogFormSchema = z.object({
  authorName: z.string().min(1, "Author name is required"),
  featuredImage: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
  publishDate: z.string().optional(),
  
  // English translation
  titleEn: z.string().min(1, "English title is required"),
  slugEn: z.string().min(1, "English slug is required"),
  excerptEn: z.string().min(1, "English excerpt is required"),
  contentEn: z.string().min(1, "English content is required"),
  metaTitleEn: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  ogImageEn: z.string().url().optional().or(z.literal("")),
  
  // Arabic translation
  titleAr: z.string().min(1, "Arabic title is required"),
  slugAr: z.string().min(1, "Arabic slug is required"),
  excerptAr: z.string().min(1, "Arabic excerpt is required"),
  contentAr: z.string().min(1, "Arabic content is required"),
  metaTitleAr: z.string().optional(),
  metaDescriptionAr: z.string().optional(),
  ogImageAr: z.string().url().optional().or(z.literal("")),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

export default function BlogManagement() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostWithTranslations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [markdownPreview, setMarkdownPreview] = useState({ en: "", ar: "" });
  const postsPerPage = 10;

  // Fetch blog posts
  const { data: postsData, isLoading } = useQuery<{ posts: BlogPostWithTranslations[], total: number }>({
    queryKey: ['/api/admin/blog', currentPage, searchQuery, statusFilter, tagFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: postsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(tagFilter && { tag: tagFilter }),
      });
      const response = await apiRequest(`/api/admin/blog?${params}`, { method: 'GET' });
      return response;
    },
  });

  const posts = postsData?.posts || [];
  const totalPosts = postsData?.total || 0;
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Form
  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      authorName: "",
      featuredImage: "",
      tags: "",
      status: "draft",
      publishDate: "",
      titleEn: "",
      slugEn: "",
      excerptEn: "",
      contentEn: "",
      metaTitleEn: "",
      metaDescriptionEn: "",
      ogImageEn: "",
      titleAr: "",
      slugAr: "",
      excerptAr: "",
      contentAr: "",
      metaTitleAr: "",
      metaDescriptionAr: "",
      ogImageAr: "",
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()) : [];
      const payload = {
        authorName: data.authorName,
        featuredImage: data.featuredImage || null,
        tags: tagsArray,
        status: data.status,
        publishDate: data.publishDate || null,
        translations: [
          {
            language: "en",
            title: data.titleEn,
            slug: data.slugEn,
            excerpt: data.excerptEn,
            content: data.contentEn,
            metaTitle: data.metaTitleEn || null,
            metaDescription: data.metaDescriptionEn || null,
            ogImage: data.ogImageEn || null,
          },
          {
            language: "ar",
            title: data.titleAr,
            slug: data.slugAr,
            excerpt: data.excerptAr,
            content: data.contentAr,
            metaTitle: data.metaTitleAr || null,
            metaDescription: data.metaDescriptionAr || null,
            ogImage: data.ogImageAr || null,
          },
        ],
      };
      return apiRequest('/api/admin/blog', { method: 'POST', body: payload });
    },
    onSuccess: () => {
      toast({
        title: language === "en" ? "Success" : "نجاح",
        description: language === "en" ? "Blog post created successfully" : "تم إنشاء المقالة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      setIsDialogOpen(false);
      form.reset();
      setMarkdownPreview({ en: "", ar: "" });
    },
    onError: (error: any) => {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: error.message || (language === "en" ? "Failed to create blog post" : "فشل في إنشاء المقالة"),
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BlogFormData }) => {
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()) : [];
      const payload = {
        authorName: data.authorName,
        featuredImage: data.featuredImage || null,
        tags: tagsArray,
        status: data.status,
        publishDate: data.publishDate || null,
        translations: [
          {
            language: "en",
            title: data.titleEn,
            slug: data.slugEn,
            excerpt: data.excerptEn,
            content: data.contentEn,
            metaTitle: data.metaTitleEn || null,
            metaDescription: data.metaDescriptionEn || null,
            ogImage: data.ogImageEn || null,
          },
          {
            language: "ar",
            title: data.titleAr,
            slug: data.slugAr,
            excerpt: data.excerptAr,
            content: data.contentAr,
            metaTitle: data.metaTitleAr || null,
            metaDescription: data.metaDescriptionAr || null,
            ogImage: data.ogImageAr || null,
          },
        ],
      };
      return apiRequest(`/api/admin/blog/${id}`, { method: 'PATCH', body: payload });
    },
    onSuccess: () => {
      toast({
        title: language === "en" ? "Success" : "نجاح",
        description: language === "en" ? "Blog post updated successfully" : "تم تحديث المقالة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      setIsDialogOpen(false);
      setEditingPost(null);
      form.reset();
      setMarkdownPreview({ en: "", ar: "" });
    },
    onError: (error: any) => {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: error.message || (language === "en" ? "Failed to update blog post" : "فشل في تحديث المقالة"),
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/blog/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: language === "en" ? "Success" : "نجاح",
        description: language === "en" ? "Blog post deleted successfully" : "تم حذف المقالة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
    },
    onError: (error: any) => {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: error.message || (language === "en" ? "Failed to delete blog post" : "فشل في حذف المقالة"),
        variant: "destructive",
      });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "draft" | "published" }) =>
      apiRequest(`/api/admin/blog/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => {
      toast({
        title: language === "en" ? "Success" : "نجاح",
        description: language === "en" ? "Status updated successfully" : "تم تحديث الحالة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
    },
    onError: (error: any) => {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: error.message || (language === "en" ? "Failed to update status" : "فشل في تحديث الحالة"),
        variant: "destructive",
      });
    },
  });

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingPost(null);
    form.reset();
    setMarkdownPreview({ en: "", ar: "" });
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (post: BlogPostWithTranslations) => {
    setEditingPost(post);
    const enTranslation = post.translations.find(t => t.language === "en");
    const arTranslation = post.translations.find(t => t.language === "ar");
    
    form.reset({
      authorName: post.authorName,
      featuredImage: post.featuredImage || "",
      tags: post.tags?.join(", ") || "",
      status: post.status,
      publishDate: post.publishDate ? new Date(post.publishDate).toISOString().split('T')[0] : "",
      titleEn: enTranslation?.title || "",
      slugEn: enTranslation?.slug || "",
      excerptEn: enTranslation?.excerpt || "",
      contentEn: enTranslation?.content || "",
      metaTitleEn: enTranslation?.metaTitle || "",
      metaDescriptionEn: enTranslation?.metaDescription || "",
      ogImageEn: enTranslation?.ogImage || "",
      titleAr: arTranslation?.title || "",
      slugAr: arTranslation?.slug || "",
      excerptAr: arTranslation?.excerpt || "",
      contentAr: arTranslation?.content || "",
      metaTitleAr: arTranslation?.metaTitle || "",
      metaDescriptionAr: arTranslation?.metaDescription || "",
      ogImageAr: arTranslation?.ogImage || "",
    });
    
    setMarkdownPreview({
      en: enTranslation?.content ? marked(enTranslation.content) as string : "",
      ar: arTranslation?.content ? marked(arTranslation.content) as string : "",
    });
    
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm(language === "en" ? "Are you sure you want to delete this post?" : "هل أنت متأكد من حذف هذه المقالة؟")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle form submit
  const onSubmit = (data: BlogFormData) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Get translation for display
  const getTranslation = (post: BlogPostWithTranslations) => {
    return post.translations.find(t => t.language === language) || post.translations[0];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === "en" ? "Blog Management" : "إدارة المدونة"}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === "en" 
              ? "Create, edit, and manage blog posts" 
              : "إنشاء وتعديل وإدارة مقالات المدونة"}
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          data-testid="button-create-post"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === "en" ? "New Post" : "مقالة جديدة"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "en" ? "Total Posts" : "إجمالي المقالات"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "en" ? "Published" : "منشور"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {posts.filter(p => p.status === "published").length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "en" ? "Drafts" : "مسودات"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {posts.filter(p => p.status === "draft").length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === "en" ? "Total Views" : "إجمالي المشاهدات"}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {posts.reduce((sum, p) => sum + (p.viewCount || 0), 0)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {language === "en" ? "Filters" : "التصفية"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="mb-2 block">
                {language === "en" ? "Search by title" : "البحث بالعنوان"}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  data-testid="input-search"
                  placeholder={language === "en" ? "Search posts..." : "ابحث عن المقالات..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter" className="mb-2 block">
                {language === "en" ? "Filter by status" : "التصفية بالحالة"}
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "draft" | "published") => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="status-filter" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "en" ? "All Statuses" : "جميع الحالات"}
                  </SelectItem>
                  <SelectItem value="draft">
                    {language === "en" ? "Draft" : "مسودة"}
                  </SelectItem>
                  <SelectItem value="published">
                    {language === "en" ? "Published" : "منشور"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tag-filter" className="mb-2 block">
                {language === "en" ? "Filter by tag" : "التصفية بالوسم"}
              </Label>
              <Input
                id="tag-filter"
                data-testid="input-tag-filter"
                placeholder={language === "en" ? "Enter tag..." : "أدخل الوسم..."}
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "en" ? "Blog Posts" : "مقالات المدونة"}
          </CardTitle>
          <CardDescription>
            {language === "en" 
              ? `Showing ${posts.length} of ${totalPosts} posts`
              : `عرض ${posts.length} من ${totalPosts} مقالة`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {language === "en" ? "No posts found" : "لا توجد مقالات"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "en" ? "Title (EN)" : "العنوان (EN)"}</TableHead>
                    <TableHead>{language === "en" ? "Title (AR)" : "العنوان (AR)"}</TableHead>
                    <TableHead>{language === "en" ? "Status" : "الحالة"}</TableHead>
                    <TableHead>{language === "en" ? "Publish Date" : "تاريخ النشر"}</TableHead>
                    <TableHead>{language === "en" ? "Views" : "المشاهدات"}</TableHead>
                    <TableHead>{language === "en" ? "Tags" : "الوسوم"}</TableHead>
                    <TableHead>{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const enTranslation = post.translations.find(t => t.language === "en");
                    const arTranslation = post.translations.find(t => t.language === "ar");
                    
                    return (
                      <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                        <TableCell className="font-medium">
                          {enTranslation?.title || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {arTranslation?.title || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            data-testid={`badge-status-${post.id}`}
                            variant={post.status === "published" ? "default" : "secondary"}
                            className={
                              post.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {post.status === "published"
                              ? (language === "en" ? "Published" : "منشور")
                              : (language === "en" ? "Draft" : "مسودة")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.publishDate
                            ? new Date(post.publishDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{post.viewCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.tags?.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(post.tags?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(post.tags?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              data-testid={`button-edit-${post.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(post)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              data-testid={`button-toggle-publish-${post.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                togglePublishMutation.mutate({
                                  id: post.id,
                                  status: post.status === "published" ? "draft" : "published",
                                })
                              }
                              disabled={togglePublishMutation.isPending}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              data-testid={`button-delete-${post.id}`}
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(post.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                {language === "en"
                  ? `Page ${currentPage} of ${totalPages}`
                  : `صفحة ${currentPage} من ${totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  data-testid="button-prev-page"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === "en" ? "Previous" : "السابق"}
                </Button>
                <Button
                  data-testid="button-next-page"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {language === "en" ? "Next" : "التالي"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost
                ? (language === "en" ? "Edit Blog Post" : "تعديل المقالة")
                : (language === "en" ? "Create New Blog Post" : "إنشاء مقالة جديدة")}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Fill in the details for both English and Arabic translations"
                : "املأ التفاصيل لكل من الترجمة الإنجليزية والعربية"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* General Fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "en" ? "Author Name" : "اسم الكاتب"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-author-name"
                          placeholder={language === "en" ? "Enter author name" : "أدخل اسم الكاتب"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "en" ? "Featured Image URL" : "رابط الصورة المميزة"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-featured-image"
                          placeholder="https://example.com/image.jpg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "en" ? "Tags (comma-separated)" : "الوسوم (مفصولة بفاصلة)"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-tags"
                          placeholder={language === "en" ? "tech, tutorial, news" : "تقنية، درس، أخبار"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "en" ? "Status" : "الحالة"}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">
                              {language === "en" ? "Draft" : "مسودة"}
                            </SelectItem>
                            <SelectItem value="published">
                              {language === "en" ? "Published" : "منشور"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "en" ? "Publish Date" : "تاريخ النشر"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            data-testid="input-publish-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Language Tabs */}
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en" data-testid="tab-english">
                    English
                  </TabsTrigger>
                  <TabsTrigger value="ar" data-testid="tab-arabic">
                    العربية
                  </TabsTrigger>
                </TabsList>

                {/* English Tab */}
                <TabsContent value="en" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="titleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-title-en"
                            placeholder="Enter English title"
                            onChange={(e) => {
                              field.onChange(e);
                              if (!editingPost) {
                                form.setValue("slugEn", generateSlug(e.target.value));
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
                    name="slugEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-slug-en"
                            placeholder="url-friendly-slug"
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-generated from title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerptEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-excerpt-en"
                            placeholder="Brief summary of the post"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (Markdown)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-content-en"
                            placeholder="Write your content in Markdown format..."
                            rows={10}
                            onChange={(e) => {
                              field.onChange(e);
                              setMarkdownPreview(prev => ({
                                ...prev,
                                en: marked(e.target.value) as string
                              }));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {markdownPreview.en && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: markdownPreview.en }}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="metaTitleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title (SEO)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-meta-title-en"
                            placeholder="SEO meta title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescriptionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description (SEO)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-meta-description-en"
                            placeholder="SEO meta description"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImageEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-og-image-en"
                            placeholder="https://example.com/og-image.jpg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Arabic Tab */}
                <TabsContent value="ar" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="titleAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنوان</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-title-ar"
                            placeholder="أدخل العنوان بالعربية"
                            dir="rtl"
                            onChange={(e) => {
                              field.onChange(e);
                              if (!editingPost) {
                                form.setValue("slugAr", generateSlug(e.target.value));
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
                    name="slugAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرابط</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-slug-ar"
                            placeholder="رابط-مناسب-للعنوان"
                          />
                        </FormControl>
                        <FormDescription>
                          يتم إنشاؤه تلقائياً من العنوان
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerptAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المقتطف</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-excerpt-ar"
                            placeholder="ملخص موجز للمقالة"
                            rows={3}
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحتوى (Markdown)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-content-ar"
                            placeholder="اكتب المحتوى بصيغة Markdown..."
                            rows={10}
                            dir="rtl"
                            onChange={(e) => {
                              field.onChange(e);
                              setMarkdownPreview(prev => ({
                                ...prev,
                                ar: marked(e.target.value) as string
                              }));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {markdownPreview.ar && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">المعاينة:</p>
                      <div 
                        className="prose max-w-none"
                        dir="rtl"
                        dangerouslySetInnerHTML={{ __html: markdownPreview.ar }}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="metaTitleAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان SEO</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-meta-title-ar"
                            placeholder="عنوان SEO"
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescriptionAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف SEO</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="textarea-meta-description-ar"
                            placeholder="وصف SEO"
                            rows={2}
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImageAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط صورة OG</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-og-image-ar"
                            placeholder="https://example.com/og-image.jpg"
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  {language === "en" ? "Cancel" : "إلغاء"}
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === "en" ? "Saving..." : "جاري الحفظ..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === "en" ? "Save" : "حفظ"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
