import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Search, BarChart3, Globe, Link, Settings, Languages, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface SeoSetting {
  id: number;
  pageType: string;
  pageIdentifier?: string;
  language: string;
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots: string;
  schema?: any;
  isActive: boolean;
  priority: number;
  hreflangUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportedLanguage {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  direction: string;
  isDefault: boolean;
  isActive: boolean;
  priority: number;
  googleAnalyticsCode?: string;
  searchConsoleProperty?: string;
  createdAt: string;
  updatedAt: string;
}

interface MultilingualKeyword {
  id: number;
  seoSettingId: number;
  keyword: string;
  language: string;
  searchVolume: number;
  difficulty: number;
  currentPosition?: number;
  targetPosition: number;
  isTracking: boolean;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

interface SitemapEntry {
  id: number;
  url: string;
  priority: number;
  changeFreq: string;
  lastModified: string;
  isActive: boolean;
  pageType?: string;
}

interface Redirect {
  id: number;
  fromUrl: string;
  toUrl: string;
  statusCode: number;
  isActive: boolean;
  hitCount: number;
  createdAt: string;
}

// Form schemas
const seoSettingFormSchema = z.object({
  pageType: z.string().min(1, "Page type is required"),
  pageIdentifier: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  title: z.string().min(10, "Title must be at least 10 characters").max(60, "Title should not exceed 60 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(160, "Description should not exceed 160 characters"),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url().optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  hreflangUrl: z.string().url().optional().or(z.literal("")),
  robots: z.string().default("index,follow"),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(0),
});

const keywordFormSchema = z.object({
  seoSettingId: z.number().min(1, "SEO setting is required"),
  keyword: z.string().min(1, "Keyword is required"),
  language: z.string().min(1, "Language is required"),
  searchVolume: z.number().min(0).default(0),
  difficulty: z.number().min(0).max(100).default(0),
  targetPosition: z.number().min(1).max(100).default(1),
  isTracking: z.boolean().default(true),
});

const redirectFormSchema = z.object({
  fromUrl: z.string().min(1, "From URL is required"),
  toUrl: z.string().url("To URL must be a valid URL"),
  statusCode: z.number().min(300).max(399).default(301),
  isActive: z.boolean().default(true),
});

export default function SeoManagement() {
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedSetting, setSelectedSetting] = useState<SeoSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("fa");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: seoSettings = [], isLoading: isLoadingSettings } = useQuery<SeoSetting[]>({
    queryKey: ["/api/admin/seo/settings", selectedLanguage],
    queryFn: () => fetch(`/api/admin/seo/settings?language=${selectedLanguage}`).then(res => res.json()),
  });

  const { data: supportedLanguages = [], isLoading: isLoadingLanguages } = useQuery<SupportedLanguage[]>({
    queryKey: ["/api/admin/seo/languages"],
  });

  const { data: multilingualAnalytics, isLoading: isLoadingMultilingualAnalytics } = useQuery({
    queryKey: ["/api/admin/seo/multilingual-analytics"],
  });

  const { data: keywordPerformance, isLoading: isLoadingKeywordPerformance } = useQuery({
    queryKey: ["/api/admin/seo/keywords/performance", selectedLanguage],
    queryFn: () => fetch(`/api/admin/seo/keywords/performance?language=${selectedLanguage}`).then(res => res.json()),
  });

  const { data: seoAnalytics, isLoading: isLoadingAnalytics } = useQuery<{
    totalImpressions: number;
    totalClicks: number;
    averageCtr: number;
    averagePosition: number;
    topPages: Array<{
      pageUrl: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
    }>;
  }>({
    queryKey: ["/api/admin/seo/analytics"],
  });

  const { data: sitemapEntries = [], isLoading: isLoadingSitemap } = useQuery<SitemapEntry[]>({
    queryKey: ["/api/admin/seo/sitemap"],
  });

  const { data: redirects = [], isLoading: isLoadingRedirects } = useQuery<Redirect[]>({
    queryKey: ["/api/admin/seo/redirects"],
  });

  // Forms
  const seoForm = useForm<z.infer<typeof seoSettingFormSchema>>({
    resolver: zodResolver(seoSettingFormSchema),
    defaultValues: {
      pageType: "",
      language: selectedLanguage,
      title: "",
      description: "",
      robots: "index,follow",
      isActive: true,
      priority: 0,
    },
  });

  const keywordForm = useForm<z.infer<typeof keywordFormSchema>>({
    resolver: zodResolver(keywordFormSchema),
    defaultValues: {
      seoSettingId: 0,
      keyword: "",
      language: selectedLanguage,
      searchVolume: 0,
      difficulty: 0,
      targetPosition: 1,
      isTracking: true,
    },
  });

  const redirectForm = useForm<z.infer<typeof redirectFormSchema>>({
    resolver: zodResolver(redirectFormSchema),
    defaultValues: {
      fromUrl: "",
      toUrl: "",
      statusCode: 301,
      isActive: true,
    },
  });

  // Mutations
  const createSeoSetting = useMutation({
    mutationFn: (data: z.infer<typeof seoSettingFormSchema>) =>
      apiRequest("/api/admin/seo/settings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
      setIsDialogOpen(false);
      seoForm.reset();
      toast({ title: "SEO setting created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating SEO setting",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateSeoSetting = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof seoSettingFormSchema> }) =>
      apiRequest(`/api/admin/seo/settings/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
      setIsDialogOpen(false);
      setSelectedSetting(null);
      seoForm.reset();
      toast({ title: "SEO setting updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating SEO setting",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteSeoSetting = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/seo/settings/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
      toast({ title: "SEO setting deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting SEO setting",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createRedirect = useMutation({
    mutationFn: (data: z.infer<typeof redirectFormSchema>) =>
      apiRequest("/api/admin/seo/redirects", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/redirects"] });
      redirectForm.reset();
      toast({ title: "Redirect created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating redirect",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateSeoSetting = (data: z.infer<typeof seoSettingFormSchema>) => {
    createSeoSetting.mutate(data);
  };

  const handleUpdateSeoSetting = (data: z.infer<typeof seoSettingFormSchema>) => {
    if (selectedSetting) {
      updateSeoSetting.mutate({ id: selectedSetting.id, data });
    }
  };

  const handleEditSetting = (setting: SeoSetting) => {
    setSelectedSetting(setting);
    seoForm.reset({
      pageType: setting.pageType,
      pageIdentifier: setting.pageIdentifier || "",
      title: setting.title,
      description: setting.description,
      keywords: setting.keywords || "",
      ogTitle: setting.ogTitle || "",
      ogDescription: setting.ogDescription || "",
      ogImage: setting.ogImage || "",
      twitterTitle: setting.twitterTitle || "",
      twitterDescription: setting.twitterDescription || "",
      twitterImage: setting.twitterImage || "",
      canonicalUrl: setting.canonicalUrl || "",
      robots: setting.robots,
      isActive: setting.isActive,
      priority: setting.priority,
    });
    setIsDialogOpen(true);
  };

  const handleCreateRedirect = (data: z.infer<typeof redirectFormSchema>) => {
    createRedirect.mutate(data);
  };

  const filteredSettings = (seoSettings as SeoSetting[]).filter((setting: SeoSetting) =>
    setting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.pageType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your website's search engine optimization settings
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add SEO Setting
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            SEO Settings
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="redirects" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Redirects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multilingual SEO Settings</CardTitle>
              <CardDescription>
                Configure meta tags, Open Graph data, and SEO settings for different languages and pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search SEO settings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingSettings ? (
                <div className="text-center py-8">Loading SEO settings...</div>
              ) : (
                <div className="space-y-4">
                  {filteredSettings.map((setting: SeoSetting) => (
                    <Card key={setting.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{setting.title}</h3>
                            <Badge variant={setting.isActive ? "default" : "secondary"}>
                              {setting.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{setting.pageType}</Badge>
                            <Badge variant="secondary">{setting.language}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {setting.description}
                          </p>
                          {setting.keywords && (
                            <p className="text-xs text-gray-500">
                              Keywords: {setting.keywords}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSetting(setting)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSeoSetting.mutate(setting.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {filteredSettings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No SEO settings found. Create your first SEO setting to get started.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Analytics</CardTitle>
              <CardDescription>
                Track your website's search engine performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="text-center py-8">Loading analytics...</div>
              ) : seoAnalytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Total Impressions</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {seoAnalytics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Total Clicks</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {seoAnalytics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Average CTR</h3>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {(seoAnalytics.averageCtr * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Avg Position</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {seoAnalytics.averagePosition.toFixed(1)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No analytics data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Management</CardTitle>
              <CardDescription>
                Manage your website's XML sitemap entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button asChild>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                    View XML Sitemap
                  </a>
                </Button>
              </div>

              {isLoadingSitemap ? (
                <div className="text-center py-8">Loading sitemap entries...</div>
              ) : (
                <div className="space-y-2">
                  {(sitemapEntries as SitemapEntry[]).map((entry: SitemapEntry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{entry.url}</p>
                        <p className="text-sm text-gray-500">
                          Priority: {entry.priority} | Frequency: {entry.changeFreq}
                        </p>
                      </div>
                      <Badge variant={entry.isActive ? "default" : "secondary"}>
                        {entry.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}

                  {(sitemapEntries as SitemapEntry[]).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No sitemap entries found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redirects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>URL Redirects</CardTitle>
              <CardDescription>
                Manage URL redirects for better SEO and user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...redirectForm}>
                <form onSubmit={redirectForm.handleSubmit(handleCreateRedirect)} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={redirectForm.control}
                      name="fromUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="/old-page" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={redirectForm.control}
                      name="toUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/new-page" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={redirectForm.control}
                      name="statusCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status Code</FormLabel>
                          <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="301">301 - Permanent</SelectItem>
                              <SelectItem value="302">302 - Temporary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={createRedirect.isPending}>
                    {createRedirect.isPending ? "Creating..." : "Add Redirect"}
                  </Button>
                </form>
              </Form>

              {isLoadingRedirects ? (
                <div className="text-center py-8">Loading redirects...</div>
              ) : (
                <div className="space-y-2">
                  {(redirects as Redirect[]).map((redirect: Redirect) => (
                    <div key={redirect.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{redirect.fromUrl} → {redirect.toUrl}</p>
                        <p className="text-sm text-gray-500">
                          Status: {redirect.statusCode} | Hits: {redirect.hitCount}
                        </p>
                      </div>
                      <Badge variant={redirect.isActive ? "default" : "secondary"}>
                        {redirect.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}

                  {(redirects as Redirect[]).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No redirects configured.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SEO Setting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSetting ? "Edit SEO Setting" : "Create SEO Setting"}
            </DialogTitle>
            <DialogDescription>
              Configure SEO metadata for your website pages
            </DialogDescription>
          </DialogHeader>

          <Form {...seoForm}>
            <form onSubmit={seoForm.handleSubmit(selectedSetting ? handleUpdateSeoSetting : handleCreateSeoSetting)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={seoForm.control}
                  name="pageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select page type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="about">About</SelectItem>
                          <SelectItem value="contact">Contact</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seoForm.control}
                  name="pageIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Identifier (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., category-1, product-123" />
                      </FormControl>
                      <FormDescription>
                        Use for specific pages like categories or products
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={seoForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Page title for search engines" />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/60 characters. Keep under 60 for best results.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={seoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Meta description for search engines" rows={3} />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/160 characters. Keep under 160 for best results.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={seoForm.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="keyword1, keyword2, keyword3" />
                    </FormControl>
                    <FormDescription>
                      Comma-separated keywords (optional, less important for modern SEO)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={seoForm.control}
                  name="ogTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Title for social media sharing" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seoForm.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Image</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/image.jpg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={seoForm.control}
                name="ogDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Graph Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Description for social media sharing" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={seoForm.control}
                  name="robots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Robots</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="index,follow">Index, Follow</SelectItem>
                          <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
                          <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                          <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seoForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seoForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this SEO setting
                        </FormDescription>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSeoSetting.isPending || updateSeoSetting.isPending}>
                  {createSeoSetting.isPending || updateSeoSetting.isPending
                    ? "Saving..."
                    : selectedSetting
                    ? "Update Setting"
                    : "Create Setting"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}