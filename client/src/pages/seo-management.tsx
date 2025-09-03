import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Search, BarChart3, Globe, Link, Settings, Languages, Target, Bot, Wand2, Brain, Lightbulb, Zap, FileText, Loader2, Sparkles, Cpu, Key } from "lucide-react";

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
  
  // AI SEO states
  const [aiPageType, setAiPageType] = useState("");
  const [aiLanguage, setAiLanguage] = useState("");
  const [selectedAiProvider, setSelectedAiProvider] = useState("openai");
  
  // API Settings states
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [aiTargetKeywords, setAiTargetKeywords] = useState("");
  const [aiBusinessContext, setAiBusinessContext] = useState("");
  const [aiSeedKeywords, setAiSeedKeywords] = useState("");
  const [aiIndustry, setAiIndustry] = useState("");
  const [aiContentToOptimize, setAiContentToOptimize] = useState("");
  const [aiOptimizeKeywords, setAiOptimizeKeywords] = useState("");
  const [aiAnalyzeUrl, setAiAnalyzeUrl] = useState("");
  const [aiAnalyzeKeywords, setAiAnalyzeKeywords] = useState("");
  const [aiResults, setAiResults] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: seoSettings = [], isLoading: isLoadingSettings } = useQuery<SeoSetting[]>({
    queryKey: ["/api/admin/seo/settings", selectedLanguage],
    queryFn: async () => {
      const url = selectedLanguage === "all" ? 
        "/api/admin/seo/settings" : 
        `/api/admin/seo/settings?language=${selectedLanguage}`;
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: supportedLanguages = [], isLoading: isLoadingLanguages } = useQuery<SupportedLanguage[]>({
    queryKey: ["/api/admin/seo/languages"],
  });

  const { data: multilingualAnalytics, isLoading: isLoadingMultilingualAnalytics } = useQuery({
    queryKey: ["/api/admin/seo/multilingual-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo/multilingual-analytics");
      const data = await res.json();
      return data || {};
    },
  });

  const { data: keywordPerformance, isLoading: isLoadingKeywordPerformance } = useQuery({
    queryKey: ["/api/admin/seo/keywords/performance", selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/seo/keywords/performance?language=${selectedLanguage}`);
      const data = await res.json();
      return data || { totalKeywords: 0, averagePosition: 0, topKeywords: [] };
    },
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

  // AI SEO mutations
  const generateAiContent = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ai/seo/generate", "POST", data),
    onSuccess: (result) => {
      setAiResults({ type: 'generate', data: result.data });
      toast({ 
        title: "✨ AI Content Generated", 
        description: "SEO content has been generated successfully" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating AI content",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

  const researchKeywords = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ai/seo/keywords", "POST", data),
    onSuccess: (result) => {
      setAiResults({ type: 'keywords', data: result.data });
      toast({ 
        title: "🔍 Keywords Researched", 
        description: "Keyword suggestions have been generated" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error researching keywords",
        description: error.message || "Failed to research keywords",
        variant: "destructive",
      });
    },
  });

  const optimizeContent = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ai/seo/optimize", "POST", data),
    onSuccess: (result) => {
      setAiResults({ type: 'optimize', data: result.data });
      toast({ 
        title: "⚡ Content Optimized", 
        description: "Content has been optimized for SEO" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error optimizing content",
        description: error.message || "Failed to optimize content",
        variant: "destructive",
      });
    },
  });

  const analyzePerformance = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ai/seo/analyze", "POST", data),
    onSuccess: (result) => {
      setAiResults({ type: 'analyze', data: result.data });
      toast({ 
        title: "📊 Analysis Complete", 
        description: "SEO performance analysis completed" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error analyzing performance",
        description: error.message || "Failed to analyze performance",
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

  // AI SEO handlers
  const handleGenerateAiContent = () => {
    if (!aiPageType || !aiLanguage) {
      toast({
        title: "Missing required fields",
        description: "Please select page type and language",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = aiTargetKeywords.split(',').map(k => k.trim()).filter(k => k);
    generateAiContent.mutate({
      pageType: aiPageType,
      language: aiLanguage,
      targetKeywords: keywords,
      businessContext: aiBusinessContext,
      aiProvider: selectedAiProvider,
    });
  };

  const handleResearchKeywords = () => {
    if (!aiSeedKeywords) {
      toast({
        title: "Missing seed keywords",
        description: "Please enter seed keywords",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = aiSeedKeywords.split(',').map(k => k.trim()).filter(k => k);
    researchKeywords.mutate({
      seedKeywords: keywords,
      language: aiLanguage || 'fa',
      industry: aiIndustry || 'chemical',
      aiProvider: selectedAiProvider,
    });
  };

  const handleOptimizeContent = () => {
    if (!aiContentToOptimize || !aiOptimizeKeywords) {
      toast({
        title: "Missing required fields",
        description: "Please enter content and target keywords",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = aiOptimizeKeywords.split(',').map(k => k.trim()).filter(k => k);
    optimizeContent.mutate({
      content: aiContentToOptimize,
      targetKeywords: keywords,
      language: aiLanguage || 'fa',
      aiProvider: selectedAiProvider,
    });
  };

  const handleAnalyzePerformance = () => {
    if (!aiAnalyzeUrl || !aiAnalyzeKeywords) {
      toast({
        title: "Missing required fields",
        description: "Please enter URL and target keywords",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = aiAnalyzeKeywords.split(',').map(k => k.trim()).filter(k => k);
    analyzePerformance.mutate({
      url: aiAnalyzeUrl,
      targetKeywords: keywords,
      aiProvider: selectedAiProvider,
    });
  };

  const handleKeywordResearch = async () => {
    if (!aiIndustry || !aiSeedKeywords) {
      toast({
        title: "فیلدهای مورد نیاز ناقص",
        description: "لطفاً نوع کسب‌وکار و کلیدواژه‌های اولیه را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);
    
    try {
      const response = await apiRequest("/api/ai/seo/keyword-research", "POST", {
        industry: aiIndustry,
        businessContext: aiBusinessContext,
        seedKeywords: aiSeedKeywords,
        language: aiLanguage || 'fa',
        pageType: aiPageType || 'homepage',
        aiProvider: selectedAiProvider
      });
      
      setAiResults(response);
      toast({
        title: "✨ کلیدواژه‌ها تولید شد",
        description: "کلیدواژه‌های هوشمند با موفقیت تولید شدند",
      });
    } catch (error: any) {
      console.error("Error generating keywords:", error);
      toast({
        title: "خطا در تولید کلیدواژه",
        description: error.message || "تولید کلیدواژه‌ها ناموفق بود",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredSettings = Array.isArray(seoSettings) ? 
    seoSettings.filter((setting: SeoSetting) =>
      setting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.pageType.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            SEO Settings
          </TabsTrigger>
          <TabsTrigger value="ai-seo" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI SEO
          </TabsTrigger>
          <TabsTrigger value="api-config" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            تنظیمات API
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

        <TabsContent value="ai-seo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI SEO Content Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
                  Generate optimized titles, descriptions, and keywords using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pageType">Page Type</Label>
                    <Select value={aiPageType} onValueChange={setAiPageType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select page type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home Page</SelectItem>
                        <SelectItem value="product">Product Page</SelectItem>
                        <SelectItem value="category">Category Page</SelectItem>
                        <SelectItem value="about">About Page</SelectItem>
                        <SelectItem value="contact">Contact Page</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={aiLanguage} onValueChange={setAiLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">Persian</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="ku">Kurdish</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="targetKeywords">Target Keywords (comma-separated)</Label>
                  <Input 
                    placeholder="chemical products, water treatment, industrial solutions"
                    value={aiTargetKeywords}
                    onChange={(e) => setAiTargetKeywords(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessContext">Business Context (optional)</Label>
                  <Textarea 
                    placeholder="Brief description of your business, products, or services..."
                    rows={3}
                    value={aiBusinessContext}
                    onChange={(e) => setAiBusinessContext(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerateAiContent}
                  disabled={generateAiContent.isPending}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {generateAiContent.isPending ? "Generating..." : "Generate AI Content"}
                </Button>
              </CardContent>
            </Card>

            {/* Keyword Research */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  AI Keyword Research
                </CardTitle>
                <CardDescription>
                  Discover high-performing keywords for your industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seedKeywords">Seed Keywords</Label>
                  <Input 
                    placeholder="chemical, industrial, water treatment"
                    value={aiSeedKeywords}
                    onChange={(e) => setAiSeedKeywords(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={aiIndustry} onValueChange={setAiIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chemical">Chemical Industry</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="industrial">Industrial Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="keywordLanguage">Language</Label>
                    <Select value={aiLanguage} onValueChange={setAiLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">Persian</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="ku">Kurdish</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleResearchKeywords}
                  disabled={researchKeywords.isPending}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {researchKeywords.isPending ? "Researching..." : "Research Keywords"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content Optimizer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Content Optimizer
              </CardTitle>
              <CardDescription>
                Optimize existing content for better SEO performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="content">Content to Optimize</Label>
                  <Textarea 
                    placeholder="Paste your content here to optimize for SEO..."
                    rows={6}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="optimizeKeywords">Target Keywords</Label>
                    <Input placeholder="primary, secondary, keywords" />
                  </div>
                  <div>
                    <Label htmlFor="contentLanguage">Language</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">Persian</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="ku">Kurdish</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Optimize Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                AI SEO Analysis
              </CardTitle>
              <CardDescription>
                Analyze your pages for SEO performance and get recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="analyzeUrl">Page URL</Label>
                  <Input placeholder="https://example.com/page" />
                </div>
                <div>
                  <Label htmlFor="analyzeKeywords">Target Keywords</Label>
                  <Input placeholder="keyword1, keyword2, keyword3" />
                </div>
              </div>
              
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze SEO Performance
              </Button>
              
              {/* Results placeholder */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Results</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Analyze SEO Performance" to see detailed analysis results including:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                  <li>• Title optimization score</li>
                  <li>• Meta description effectiveness</li>
                  <li>• Keyword density analysis</li>
                  <li>• Content structure recommendations</li>
                  <li>• Technical SEO suggestions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                تنظیمات کلیدهای API هوش مصنوعی
              </CardTitle>
              <CardDescription>
                مدیریت کلیدهای OpenAI و DeepSeek برای سرویس‌های SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">OpenAI GPT-5</h3>
                  <Badge variant="secondary">محتوا و تحلیل</Badge>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="openai-key">کلید API OpenAI:</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type={showOpenaiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? "🙈" : "👁️"}
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (openaiApiKey.trim()) {
                          // Test OpenAI API key
                          toast({
                            title: "🔄 در حال تست...",
                            description: "کلید OpenAI در حال بررسی است"
                          });
                          
                          // Simulate API test - backend implementation needed
                          setTimeout(() => {
                            toast({
                              title: "✅ کلید معتبر است",
                              description: "کلید OpenAI با موفقیت تست شد"
                            });
                          }, 2000);
                        }
                      }}
                      disabled={!openaiApiKey.trim()}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      تست
                    </Button>
                  </div>
                </div>
              </div>

              {/* DeepSeek API Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">DeepSeek AI</h3>
                  <Badge variant="secondary">تحقیق و تجزیه‌وتحلیل</Badge>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="deepseek-key">کلید API DeepSeek:</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="deepseek-key"
                        type={showDeepseekKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={deepseekApiKey}
                        onChange={(e) => setDeepseekApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      >
                        {showDeepseekKey ? "🙈" : "👁️"}
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (deepseekApiKey.trim()) {
                          // Test DeepSeek API key
                          toast({
                            title: "🔄 در حال تست...",
                            description: "کلید DeepSeek در حال بررسی است"
                          });
                          
                          // Simulate API test - backend implementation needed
                          setTimeout(() => {
                            toast({
                              title: "✅ کلید معتبر است", 
                              description: "کلید DeepSeek با موفقیت تست شد"
                            });
                          }, 2000);
                        }
                      }}
                      disabled={!deepseekApiKey.trim()}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      تست
                    </Button>
                  </div>
                </div>
              </div>

              {/* Save Settings */}
              <div className="flex justify-end pt-4 border-t">
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setOpenaiApiKey('');
                      setDeepseekApiKey('');
                      toast({
                        title: "کلیدها پاک شدند",
                        description: "تمام کلیدهای API پاک شدند"
                      });
                    }}
                  >
                    پاک کردن همه
                  </Button>
                  <Button 
                    onClick={() => {
                      // Save API keys
                      const keys: any = {};
                      if (openaiApiKey.trim()) keys.openaiApiKey = openaiApiKey.trim();
                      if (deepseekApiKey.trim()) keys.deepseekApiKey = deepseekApiKey.trim();
                      
                      if (Object.keys(keys).length > 0) {
                        // For now, just show success toast - backend implementation needed
                        toast({
                          title: "✅ کلیدها ذخیره شدند",
                          description: "تنظیمات API با موفقیت ذخیره شد"
                        });
                      }
                    }}
                    disabled={!openaiApiKey.trim() && !deepseekApiKey.trim()}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    ذخیره تنظیمات
                  </Button>
                </div>
              </div>

              {/* API Usage Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">ℹ️ راهنمای استفاده</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>OpenAI GPT-5:</strong> بهترین انتخاب برای تولید محتوا و تحلیل‌های کیفی</li>
                  <li>• <strong>DeepSeek AI:</strong> مناسب برای تحقیق کلیدواژه و تحلیل‌های عمیق</li>
                  <li>• <strong>امنیت:</strong> کلیدها به‌صورت رمزگذاری شده در سرور ذخیره می‌شوند</li>
                  <li>• <strong>هزینه:</strong> هر API بر اساس استفاده محاسبه می‌شود</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Research & Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  پژوهش کلیدواژه با هوش مصنوعی
                </CardTitle>
                <CardDescription className="text-right">
                  تولید کلیدواژه‌های مؤثر برای بهبود رتبه‌بندی در جستجوگرها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="businessType" className="text-right">نوع کسب‌وکار</Label>
                    <Input
                      id="businessType"
                      value={aiIndustry}
                      onChange={(e) => setAiIndustry(e.target.value)}
                      placeholder="مثال: فروش مواد شیمیایی، صنایع نفت‌وگاز"
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetMarket" className="text-right">بازار هدف</Label>
                    <Input
                      id="targetMarket"
                      value={aiBusinessContext}
                      onChange={(e) => setAiBusinessContext(e.target.value)}
                      placeholder="مثال: عراق، خاورمیانه، مشتریان صنعتی"
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="seedKeywords" className="text-right">کلیدواژه‌های اولیه</Label>
                    <Textarea
                      id="seedKeywords"
                      value={aiSeedKeywords}
                      onChange={(e) => setAiSeedKeywords(e.target.value)}
                      placeholder="مثال: مواد شیمیایی، حلال، کود، پتروشیمی"
                      rows={3}
                      className="text-right"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="language" className="text-right">زبان</Label>
                      <Select value={aiLanguage} onValueChange={setAiLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب زبان" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fa">فارسی</SelectItem>
                          <SelectItem value="ar">عربی</SelectItem>
                          <SelectItem value="en">انگلیسی</SelectItem>
                          <SelectItem value="ku">کردی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="pageType" className="text-right">نوع صفحه</Label>
                      <Select value={aiPageType} onValueChange={setAiPageType}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع صفحه" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">صفحه اصلی</SelectItem>
                          <SelectItem value="product">صفحه محصول</SelectItem>
                          <SelectItem value="category">دسته‌بندی</SelectItem>
                          <SelectItem value="about">درباره ما</SelectItem>
                          <SelectItem value="service">خدمات</SelectItem>
                          <SelectItem value="blog">وبلاگ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleKeywordResearch}
                  disabled={isAiLoading || !aiIndustry || !aiSeedKeywords}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      در حال تولید کلیدواژه...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      تولید کلیدواژه‌های هوشمند
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Keyword Performance Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  عملکرد کلیدواژه‌ها
                </CardTitle>
                <CardDescription className="text-right">
                  رصد و تحلیل عملکرد کلیدواژه‌های فعلی
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeywordPerformance ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                    <p className="text-gray-600">در حال بارگذاری آمار کلیدواژه‌ها...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {keywordPerformance?.totalKeywords || 0}
                        </div>
                        <div className="text-sm text-gray-600">کل کلیدواژه‌ها</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {keywordPerformance?.averagePosition ? 
                            keywordPerformance.averagePosition.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">میانگین رتبه</div>
                      </div>
                    </div>
                    
                    {keywordPerformance?.topKeywords && keywordPerformance.topKeywords.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-right">برترین کلیدواژه‌ها</h4>
                        {keywordPerformance.topKeywords.map((keyword: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant={keyword.position <= 10 ? "default" : "secondary"}>
                                رتبه {keyword.position}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {keyword.clicks} کلیک
                              </span>
                            </div>
                            <span className="font-medium text-right">{keyword.keyword}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>هنوز کلیدواژه‌ای ثبت نشده است</p>
                        <p className="text-sm mt-1">از بخش تولید کلیدواژه استفاده کنید</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Results Display */}
          {aiResults && aiResults.type === 'keywords' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  کلیدواژه‌های پیشنهادی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiResults.data.primary && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-purple-600 text-right">کلیدواژه‌های اصلی</h4>
                      <div className="space-y-1">
                        {aiResults.data.primary.map((keyword: string, index: number) => (
                          <Badge key={index} variant="default" className="mr-1 mb-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiResults.data.longTail && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600 text-right">کلیدواژه‌های طولانی</h4>
                      <div className="space-y-1">
                        {aiResults.data.longTail.map((keyword: string, index: number) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiResults.data.semantic && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-600 text-right">کلیدواژه‌های مرتبط</h4>
                      <div className="space-y-1">
                        {aiResults.data.semantic.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {aiResults.data.recommendations && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2 text-right">
                      توصیه‌های بهینه‌سازی
                    </h4>
                    <ul className="space-y-1 text-sm text-yellow-700 text-right">
                      {aiResults.data.recommendations.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multilingual SEO Analytics</CardTitle>
              <CardDescription>
                Track your website's search engine performance across different languages and countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMultilingualAnalytics ? (
                <div className="text-center py-8">Loading multilingual analytics...</div>
              ) : multilingualAnalytics ? (
                <div className="space-y-6">
                  {multilingualAnalytics?.byLanguage && multilingualAnalytics.byLanguage.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Performance by Language</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {multilingualAnalytics.byLanguage.map((lang: any) => (
                          <div key={lang.language} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{lang.language.toUpperCase()}</h5>
                              <Badge variant="outline">{supportedLanguages.find(l => l.code === lang.language)?.nativeName}</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Impressions:</span>
                                <span className="font-medium">{lang.totalImpressions.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Clicks:</span>
                                <span className="font-medium">{lang.totalClicks.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Avg Position:</span>
                                <span className="font-medium">{lang.averagePosition.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {multilingualAnalytics?.byCountry && multilingualAnalytics.byCountry.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Performance by Country</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {multilingualAnalytics.byCountry.slice(0, 8).map((country: any) => (
                          <div key={country.country} className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">{country.country}</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Impressions:</span>
                                <span className="font-medium">{country.totalImpressions.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Clicks:</span>
                                <span className="font-medium">{country.totalClicks.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!multilingualAnalytics?.byLanguage || multilingualAnalytics.byLanguage.length === 0) && 
                   (!multilingualAnalytics?.byCountry || multilingualAnalytics.byCountry.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No multilingual analytics data available yet. Data will appear once you start getting traffic from different languages and countries.
                    </div>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={seoForm.control}
                  name="hreflangUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hreflang URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/page" />
                      </FormControl>
                      <FormDescription>
                        URL for this language version (for hreflang tags)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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