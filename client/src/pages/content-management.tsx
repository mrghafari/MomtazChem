import { useState, useRef } from "react";
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
import { ArrowLeft, Upload, Image, Type, Globe, Palette, Save, RefreshCw, Trash2, Eye, Edit3 } from "lucide-react";
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

export default function ContentManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar' | 'ku' | 'tr'>('en');
  const [selectedSection, setSelectedSection] = useState<string>('admin_dashboard');
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  // Check if user is super admin (id = 1)
  const isSuperAdmin = user?.id === 1;

  // Query for content items
  const { data: contentItems, isLoading: loadingContent } = useQuery({
    queryKey: ['/api/content-management/items', selectedLanguage, selectedSection],
    queryFn: () => 
      fetch(`/api/content-management/items?language=${selectedLanguage}&section=${selectedSection}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
  });

  // Query for image assets
  const { data: imageAssets, isLoading: loadingImages } = useQuery({
    queryKey: ['/api/content-management/images', selectedSection],
    queryFn: () => 
      fetch(`/api/content-management/images?section=${selectedSection}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
  });

  // Mutation for updating content
  const updateContentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; isActive: boolean }) => {
      const response = await fetch(`/api/content-management/items/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Content updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/content-management/items'] });
      setEditingContent(null);
    },
    onError: () => {
      toast({ title: "Failed to update content", variant: "destructive" });
    }
  });

  // Mutation for uploading images
  const uploadImageMutation = useMutation({
    mutationFn: (formData: FormData) =>
      fetch('/api/content-management/images/upload', {
        method: 'POST',
        body: formData
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Image uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/content-management/images'] });
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
    }
  });

  // Mutation for deleting images
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/content-management/images/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Image deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/content-management/images'] });
    },
    onError: () => {
      toast({ title: "Failed to delete image", variant: "destructive" });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
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
    { value: 'admin_dashboard', label: 'Admin Dashboard' },
    { value: 'home', label: 'Home Page' },
    { value: 'about', label: 'About Page' },
    { value: 'services', label: 'Services Page' },
    { value: 'contact', label: 'Contact Page' },
    { value: 'paint_solvents', label: 'Paint & Solvents' },
    { value: 'industrial_chemicals', label: 'Industrial Chemicals' },
    { value: 'commercial_goods', label: 'Commercial Goods' },
    { value: 'technical_equipment', label: 'Technical Equipment' },
    { value: 'products', label: 'Products' },
    { value: 'footer', label: 'Footer' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'hero', label: 'Hero Section' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'social_media', label: 'Social Media Links' }
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
        <Tabs defaultValue="text-content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text-content" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Text Content
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
          <TabsContent value="text-content" className="space-y-6">
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