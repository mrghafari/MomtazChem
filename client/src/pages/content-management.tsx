import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Image, Type, Globe, Palette, Save, RefreshCw, Trash2, Eye, Edit3, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ContentItem {
  id: number;
  key: string;
  content: string;
  contentType: 'text' | 'html' | 'image' | 'json';
  language: 'en' | 'ar' | 'ku' | 'tr';
  section: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ImageAsset {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string;
  section: string;
  isActive: boolean;
  createdAt: string;
}

interface ShowcaseProduct {
  id: number;
  name: string;
  technicalName?: string;
  description?: string;
  category: string;
  features?: string[];
  applications?: string[];
  inventoryStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl?: string;
  pdfCatalogUrl?: string;
  isActive: boolean;
}

interface CategoryProductSettings {
  category: string;
  randomDisplayEnabled: boolean;
  maxDisplayCount: number;
  selectedProductIds: number[];
}

export default function ContentManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar' | 'ku' | 'tr'>('en');
  const [selectedSection, setSelectedSection] = useState<string>('contact');
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('content');
  const [selectedCategory, setSelectedCategory] = useState<string>('agricultural-fertilizers');

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'settings-control') {
      setActiveTab('settings-control');
    }
  }, []);

  // Check if user is super admin (id = 1)
  const isSuperAdmin = user?.id === 1;

  // Query for content items using admin API
  const { data: contentItems, isLoading: loadingContent } = useQuery({
    queryKey: ['/api/admin/content', selectedLanguage, selectedSection],
    queryFn: () => 
      fetch(`/api/admin/content?language=${selectedLanguage}&section=${selectedSection}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
  });

  // Query for public content settings (for non-authenticated toggle state display)
  const { data: publicContentItems, isLoading: loadingPublicContent } = useQuery({
    queryKey: ['/api/public/content-settings', selectedLanguage, selectedSection],
    queryFn: () => 
      fetch(`/api/public/content-settings?language=${selectedLanguage}&section=${selectedSection}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
  });

  // Query for image assets
  const { data: imageAssets, isLoading: loadingImages } = useQuery({
    queryKey: ['/api/admin/content/images', selectedSection],
    queryFn: () => 
      fetch(`/api/admin/content/images?section=${selectedSection}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
  });

  // Query for products by category
  const { data: categoryProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['/api/products', selectedCategory],
    queryFn: () => 
      fetch(`/api/products?category=${selectedCategory}`)
        .then(res => res.json())
        .then(data => Array.isArray(data) ? data : [])
  });

  // Mutation for updating content
  const updateContentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/content/${data.id}`, {
        method: 'PUT',
        body: {
          content: data.content,
          isActive: data.isActive
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "محتوا به‌روزرسانی شد",
        description: "تغییرات محتوا با موفقیت ذخیره شد."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
    }
  });

  // Mutation for creating content
  const createContentMutation = useMutation({
    mutationFn: async (data: { key: string; content: string; contentType: string; language: string; section: string; isActive?: boolean }) => {
      return apiRequest('/api/admin/content', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "محتوا ایجاد شد",
        description: "محتوای جدید با موفقیت ایجاد شد."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
    }
  });

  // Mutation for uploading images
  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/content/images/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تصویر آپلود شد",
        description: "تصویر با موفقیت آپلود شد."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content/images'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  // Mutation for deleting images
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/images/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "تصویر حذف شد",
        description: "تصویر با موفقیت حذف شد."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content/images'] });
    },
    onError: () => {
      toast({ 
        title: "خطا در حذف تصویر", 
        variant: "destructive",
        description: "تصویر حذف نشد. لطفاً دوباره تلاش کنید."
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "فایل غیرمجاز", 
        description: "لطفاً یک فایل تصویر انتخاب کنید",
        variant: "destructive" 
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('section', selectedSection);
    formData.append('alt', file.name.split('.')[0]);

    uploadImageMutation.mutate(formData);
  };

  const handleContentEdit = (item: ContentItem) => {
    setEditingContent(item);
  };

  const handleContentSave = () => {
    if (!editingContent) return;
    
    updateContentMutation.mutate({
      id: editingContent.id,
      content: editingContent.content,
      isActive: editingContent.isActive
    });
  };

  const sections = [
    { value: 'contact', label: 'Contact Page (104 آیتم)' },
    { value: 'services', label: 'Services Page (52 آیتم)' },
    { value: 'home', label: 'Home Page (47 آیتم)' },
    { value: 'about', label: 'About Page (40 آیتم)' },
    { value: 'technical_equipment', label: 'Technical Equipment (34 آیتم)' },
    { value: 'admin_dashboard', label: 'Admin Dashboard (34 آیتم)' },
    { value: 'industrial_chemicals', label: 'Industrial Chemicals (30 آیتم)' },
    { value: 'paint_solvents', label: 'Paint & Solvents (30 آیتم)' },
    { value: 'commercial_goods', label: 'Commercial Goods (30 آیتم)' },
    { value: 'social_media', label: 'Social Media Links (24 آیتم)' },
    { value: 'homepage', label: 'Homepage (4 آیتم)' },
    { value: 'footer', label: 'Footer (1 آیتم)' },
    { value: 'products', label: 'Products' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'hero', label: 'Hero Section' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'discount_banner', label: 'بنر تخفیف (Discount Banner)' },
    { value: 'ai_settings', label: 'تنظیمات AI (AI Settings)' }
  ];

  const languages = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ar', label: 'Arabic', flag: '🇮🇶' },
    { value: 'ku', label: 'Kurdish', flag: '🏳️' },
    { value: 'tr', label: 'Turkish', flag: '🇹🇷' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin/site-management")}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Site Management
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Content Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage website content, images, and multilingual text
              </p>
            </div>
          </div>
          
          {/* Language and Section Selectors */}
          <div className="flex items-center gap-4">
            <Select value={selectedLanguage} onValueChange={(value: 'en' | 'ar' | 'ku' | 'tr') => setSelectedLanguage(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section.value} value={section.value}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Text Content
            </TabsTrigger>
            <TabsTrigger value="settings-control" className="flex items-center gap-2">
              <Switch className="w-4 h-4" />
              کنترل تنظیمات
            </TabsTrigger>
            <TabsTrigger value="products-display" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              نمایش محصولات
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="translations" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Translations
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme Settings
            </TabsTrigger>
          </TabsList>

          {/* Text Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6">
              {loadingContent ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading content...</span>
                </div>
              ) : (
                <>
                  {contentItems && contentItems.length > 0 ? (
                    contentItems.map((item: ContentItem) => (
                      <Card key={item.id} className="relative">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{item.key}</CardTitle>
                            <CardDescription>
                              Section: {item.section} | Type: {item.contentType} | Language: {item.language.toUpperCase()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentEdit(item)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {editingContent?.id === item.id ? (
                            <div className="space-y-4">
                              <Textarea
                                value={editingContent.content}
                                onChange={(e) => setEditingContent({
                                  ...editingContent,
                                  content: e.target.value
                                })}
                                rows={6}
                                className="font-mono text-sm"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={editingContent.isActive}
                                    onCheckedChange={(checked) => setEditingContent({
                                      ...editingContent,
                                      isActive: checked
                                    })}
                                  />
                                  <Label>Active</Label>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingContent(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleContentSave}
                                    disabled={updateContentMutation.isPending}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap font-mono">
                                {item.content.length > 200 
                                  ? `${item.content.substring(0, 200)}...` 
                                  : item.content
                                }
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Type className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No content found for this section and language</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Content will be automatically created when you update text in the website interface
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Settings Control Tab */}
          <TabsContent value="settings-control" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Discount Banner Control */}
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    کنترل بنر تخفیف
                  </CardTitle>
                  <CardDescription>
                    فعال/غیرفعال کردن بنر تخفیف در صفحه اصلی وب‌سایت
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(updateContentMutation.isPending || createContentMutation.isPending) && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال ذخیره تغییرات...
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">وضعیت بنر تخفیف</h4>
                      <p className="text-sm text-gray-600">نمایش بنر تخفیف در بالای صفحه</p>
                    </div>
                    <Switch
                      checked={contentItems?.find((item: ContentItem) => item.key === 'discount_banner_enabled')?.isActive || false}
                      disabled={updateContentMutation.isPending || createContentMutation.isPending}
                      onCheckedChange={(checked) => {
                        console.log('🎛️ [TOGGLE] Discount banner toggle clicked:', checked);
                        const existingItem = contentItems?.find((item: ContentItem) => item.key === 'discount_banner_enabled');
                        if (existingItem) {
                          console.log('🎛️ [TOGGLE] Updating existing discount banner item:', existingItem.id);
                          updateContentMutation.mutate({
                            id: existingItem.id,
                            content: checked ? 'true' : 'false',
                            isActive: checked
                          });
                        } else {
                          console.log('🎛️ [TOGGLE] Creating new discount banner item');
                          createContentMutation.mutate({
                            key: 'discount_banner_enabled',
                            content: checked ? 'true' : 'false',
                            contentType: 'text',
                            language: selectedLanguage,
                            section: 'discount_banner',
                            isActive: checked
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>متن بنر تخفیف</Label>
                    <Textarea
                      placeholder="متن بنر تخفیف را وارد کنید..."
                      value={contentItems?.find((item: ContentItem) => item.key === 'discount_banner_text')?.content || ''}
                      disabled={updateContentMutation.isPending || createContentMutation.isPending}
                      onChange={(e) => {
                        console.log('🎛️ [TEXT] Discount banner text changed:', e.target.value);
                        const existingItem = contentItems?.find((item: ContentItem) => item.key === 'discount_banner_text');
                        if (existingItem) {
                          console.log('🎛️ [TEXT] Updating existing discount banner text item:', existingItem.id);
                          updateContentMutation.mutate({
                            id: existingItem.id,
                            content: e.target.value,
                            isActive: existingItem.isActive
                          });
                        } else {
                          console.log('🎛️ [TEXT] Creating new discount banner text item');
                          createContentMutation.mutate({
                            key: 'discount_banner_text',
                            content: e.target.value,
                            contentType: 'text',
                            language: selectedLanguage,
                            section: 'discount_banner',
                            isActive: true
                          });
                        }
                      }}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Settings Control */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    کنترل تنظیمات AI
                  </CardTitle>
                  <CardDescription>
                    فعال/غیرفعال کردن ویژگی‌های هوش مصنوعی
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(updateContentMutation.isPending || createContentMutation.isPending) && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال ذخیره تغییرات...
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">وضعیت AI</h4>
                      <p className="text-sm text-gray-600">فعال‌سازی قابلیت‌های هوش مصنوعی</p>
                    </div>
                    <div>
                      <Switch
                        checked={contentItems?.find((item: ContentItem) => item.key === 'ai_enabled')?.isActive || false}
                        disabled={updateContentMutation.isPending || createContentMutation.isPending}
                        onCheckedChange={(checked) => {
                          console.log('🎛️ [TOGGLE] AI toggle clicked:', checked);
                          const existingItem = contentItems?.find((item: ContentItem) => item.key === 'ai_enabled');
                          if (existingItem) {
                            console.log('🎛️ [TOGGLE] Updating existing AI item:', existingItem.id);
                            updateContentMutation.mutate({
                              id: existingItem.id,
                              content: checked ? 'true' : 'false',
                              isActive: checked
                            });
                          } else {
                            console.log('🎛️ [TOGGLE] Creating new AI item');
                            createContentMutation.mutate({
                              key: 'ai_enabled',
                              content: checked ? 'true' : 'false',
                              contentType: 'text',
                              language: selectedLanguage,
                              section: 'ai_settings',
                              isActive: checked
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>پیام AI</Label>
                    <Textarea
                      placeholder="پیام یا توضیح AI را وارد کنید..."
                      value={contentItems?.find((item: ContentItem) => item.key === 'ai_message')?.content || ''}
                      disabled={updateContentMutation.isPending || createContentMutation.isPending}
                      onChange={(e) => {
                        console.log('🎛️ [TEXT] AI message changed:', e.target.value);
                        const existingItem = contentItems?.find((item: ContentItem) => item.key === 'ai_message');
                        if (existingItem) {
                          console.log('🎛️ [TEXT] Updating existing AI message item:', existingItem.id);
                          updateContentMutation.mutate({
                            id: existingItem.id,
                            content: e.target.value,
                            isActive: existingItem.isActive
                          });
                        } else {
                          console.log('🎛️ [TEXT] Creating new AI message item');
                          createContentMutation.mutate({
                            key: 'ai_message',
                            content: e.target.value,
                            contentType: 'text',
                            language: selectedLanguage,
                            section: 'ai_settings',
                            isActive: true
                          });
                        }
                      }}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>API کلید OpenAI</Label>
                    <Input
                      type="password"
                      placeholder="OpenAI API Key..."
                      value={contentItems?.find((item: ContentItem) => item.key === 'openai_api_key')?.content || ''}
                      disabled={updateContentMutation.isPending || createContentMutation.isPending}
                      onChange={(e) => {
                        console.log('🎛️ [TEXT] OpenAI API Key changed');
                        const existingItem = contentItems?.find((item: ContentItem) => item.key === 'openai_api_key');
                        if (existingItem) {
                          console.log('🎛️ [TEXT] Updating existing OpenAI API Key item:', existingItem.id);
                          updateContentMutation.mutate({
                            id: existingItem.id,
                            content: e.target.value,
                            isActive: existingItem.isActive
                          });
                        } else {
                          console.log('🎛️ [TEXT] Creating new OpenAI API Key item');
                          createContentMutation.mutate({
                            key: 'openai_api_key',
                            content: e.target.value,
                            contentType: 'text',
                            language: selectedLanguage,
                            section: 'ai_settings',
                            isActive: true
                          });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Display Tab */}
          <TabsContent value="products-display" className="space-y-6">
            <div className="grid gap-6">
              {/* Category Selection */}
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Package className="w-5 h-5" />
                    مدیریت نمایش محصولات در دسته‌بندی‌ها
                  </CardTitle>
                  <CardDescription>
                    تنظیم نمایش تصادفی محصولات در صفحات دسته‌بندی
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Selector */}
                  <div className="space-y-3">
                    <Label>انتخاب دسته‌بندی</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agricultural-fertilizers">
                          <div className="flex items-center gap-2">
                            <span>🌾</span>
                            <span>کودهای کشاورزی (Agricultural Fertilizers)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="industrial-chemicals">
                          <div className="flex items-center gap-2">
                            <span>⚗️</span>
                            <span>مواد شیمیایی صنعتی (Industrial Chemicals)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="paint-solvents">
                          <div className="flex items-center gap-2">
                            <span>🎨</span>
                            <span>حلال‌های رنگ (Paint Solvents)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fuel-additives">
                          <div className="flex items-center gap-2">
                            <span>⛽</span>
                            <span>افزودنی‌های سوخت (Fuel Additives)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="water-treatment">
                          <div className="flex items-center gap-2">
                            <span>💧</span>
                            <span>تصفیه آب (Water Treatment)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <span>📦</span>
                            <span>سایر محصولات (Other Products)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Random Display Settings */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <h4 className="font-medium text-gray-900">نمایش تصادفی فعال</h4>
                        <p className="text-sm text-gray-600">نمایش محصولات به صورت تصادفی در این دسته‌بندی</p>
                      </div>
                      <Switch
                        checked={(() => {
                          // Use admin authenticated data if available, fallback to public data
                          const adminItem = contentItems?.find((item: ContentItem) => item.key === `random_display_${selectedCategory}`);
                          const publicItem = publicContentItems?.find((item: ContentItem) => item.key === `random_display_${selectedCategory}`);
                          const isChecked = adminItem?.isActive || publicItem?.isActive || false;
                          console.log('🎛️ [TOGGLE STATE] Random display switch:', { 
                            category: selectedCategory, 
                            adminItem: adminItem?.isActive, 
                            publicItem: publicItem?.isActive, 
                            final: isChecked 
                          });
                          return isChecked;
                        })()}
                        disabled={updateContentMutation.isPending || createContentMutation.isPending}
                        onCheckedChange={(checked) => {
                          console.log('🎛️ [TOGGLE] Random display toggle clicked:', { category: selectedCategory, checked });
                          const existingItem = contentItems?.find((item: ContentItem) => item.key === `random_display_${selectedCategory}`);
                          if (existingItem) {
                            console.log('🎛️ [TOGGLE] Updating existing item:', existingItem.id);
                            updateContentMutation.mutate({
                              id: existingItem.id,
                              content: checked ? 'true' : 'false',
                              isActive: checked
                            });
                          } else {
                            console.log('🎛️ [TOGGLE] Creating new item');
                            createContentMutation.mutate({
                              key: `random_display_${selectedCategory}`,
                              content: checked ? 'true' : 'false',
                              contentType: 'text',
                              language: selectedLanguage,
                              section: 'product_display',
                              isActive: checked
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>تعداد محصولات نمایشی</Label>
                      <Select
                        value={(() => {
                          const adminItem = contentItems?.find((item: ContentItem) => item.key === `max_display_${selectedCategory}`);
                          const publicItem = publicContentItems?.find((item: ContentItem) => item.key === `max_display_${selectedCategory}`);
                          return adminItem?.content || publicItem?.content || '3';
                        })()}
                        onValueChange={(value) => {
                          console.log('🎛️ [MAX DISPLAY] Value changed:', { category: selectedCategory, value });
                          const existingItem = contentItems?.find((item: ContentItem) => item.key === `max_display_${selectedCategory}`);
                          if (existingItem) {
                            console.log('🎛️ [MAX DISPLAY] Updating existing item:', existingItem.id);
                            updateContentMutation.mutate({
                              id: existingItem.id,
                              content: value,
                              isActive: existingItem.isActive
                            });
                          } else {
                            console.log('🎛️ [MAX DISPLAY] Creating new item');
                            createContentMutation.mutate({
                              key: `max_display_${selectedCategory}`,
                              content: value,
                              contentType: 'text',
                              language: selectedLanguage,
                              section: 'product_display',
                              isActive: true
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 محصول</SelectItem>
                          <SelectItem value="2">2 محصول</SelectItem>
                          <SelectItem value="3">3 محصول</SelectItem>
                          <SelectItem value="4">4 محصول</SelectItem>
                          <SelectItem value="5">5 محصول</SelectItem>
                          <SelectItem value="6">6 محصول</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products List for Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    محصولات موجود در دسته‌بندی {selectedCategory}
                  </CardTitle>
                  <CardDescription>
                    {categoryProducts?.length || 0} محصول در این دسته‌بندی موجود است
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProducts ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="ml-2">در حال بارگذاری محصولات...</span>
                    </div>
                  ) : categoryProducts && categoryProducts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map((product: ShowcaseProduct) => (
                        <div
                          key={product.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          {product.imageUrl && (
                            <div className="aspect-video w-full mb-3 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                          {product.technicalName && (
                            <p className="text-sm text-gray-600 mb-2">{product.technicalName}</p>
                          )}
                          {product.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <Badge 
                              variant={product.inventoryStatus === 'in_stock' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {product.inventoryStatus === 'in_stock' ? '✅ موجود' : 
                               product.inventoryStatus === 'low_stock' ? '⚠️ کم' : '❌ ناموجود'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ID: {product.id}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">هیچ محصولی در این دسته‌بندی یافت نشد</p>
                      <p className="text-sm text-gray-400 mt-2">
                        ابتدا محصولاتی را به این دسته‌بندی اضافه کنید
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview Section */}
              {categoryProducts && categoryProducts.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Eye className="w-5 h-5" />
                      پیش‌نمایش نمایش تصادفی
                    </CardTitle>
                    <CardDescription>
                      مثال از نحوه نمایش محصولات در صفحه دسته‌بندی
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-green-300">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        محصولات پیشنهادی {selectedCategory}
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {categoryProducts
                          .sort(() => Math.random() - 0.5)
                          .slice(0, parseInt(contentItems?.find((item: ContentItem) => item.key === `max_display_${selectedCategory}`)?.content || '3'))
                          .map((product: ShowcaseProduct) => (
                            <div
                              key={product.id}
                              className="p-3 bg-gray-50 rounded-lg border text-center"
                            >
                              {product.imageUrl && (
                                <div className="aspect-square w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg overflow-hidden">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <h4 className="font-medium text-sm text-gray-900">{product.name}</h4>
                              <Badge variant="outline" className="text-xs mt-1">
                                Get Quote
                              </Badge>
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        * محصولات هر بار به صورت تصادفی انتخاب و نمایش داده می‌شوند
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload New Image
                </CardTitle>
                <CardDescription>
                  Upload images for the {sections.find(s => s.value === selectedSection)?.label} section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                    className="mb-4"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadImageMutation.isPending ? "Uploading..." : "Choose Image"}
                  </Button>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPEG, PNG, WebP, SVG
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            {loadingImages ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading images...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageAssets && imageAssets.length > 0 ? (
                  imageAssets.map((image: ImageAsset) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge variant={image.isActive ? "default" : "secondary"} className="text-xs">
                            {image.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">{image.originalName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {(image.size / 1024).toFixed(1)} KB • {image.mimeType}
                        </p>
                        <div className="flex justify-between mt-3">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteImageMutation.mutate(image.id)}
                            disabled={deleteImageMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="text-center py-8">
                        <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No images found for this section</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Upload images using the form above
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Translation Management</CardTitle>
                <CardDescription>
                  Manage multilingual content across all languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {languages.map(lang => (
                    <div key={lang.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lang.flag}</span>
                          <h3 className="font-medium">{lang.label}</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLanguage(lang.value as 'en' | 'ar' | 'ku')}
                        >
                          Edit Content
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Switch to this language to edit content items
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings Tab */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Visual Settings</CardTitle>
                <CardDescription>
                  Customize the appearance and styling of your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Color Scheme</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                        <div className="w-full h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Default Blue</p>
                      </div>
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                        <div className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Green Theme</p>
                      </div>
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                        <div className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Purple Theme</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Typography</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span>Primary Font Family</span>
                        <Select defaultValue="inter">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                            <SelectItem value="opensans">Open Sans</SelectItem>
                            <SelectItem value="lato">Lato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Font Size Scale</span>
                        <Select defaultValue="medium">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Layout Settings</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span>Container Width</span>
                        <Select defaultValue="xl">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lg">Large (1024px)</SelectItem>
                            <SelectItem value="xl">Extra Large (1280px)</SelectItem>
                            <SelectItem value="2xl">2X Large (1536px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Rounded Corners</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Drop Shadows</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}