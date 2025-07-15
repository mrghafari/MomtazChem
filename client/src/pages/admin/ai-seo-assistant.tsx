import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Brain, 
  Wand2, 
  Target, 
  Search, 
  TrendingUp, 
  Globe,
  Zap, 
  Bot, 
  Lightbulb,
  BarChart3,
  FileText,
  Languages,
  ArrowLeft,
  Sparkles,
  Rocket,
  Eye,
  Award
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Schemas
const aiContentGenerationSchema = z.object({
  pageType: z.string().min(1, "Page type is required"),
  language: z.string().min(1, "Language is required"),
  targetKeywords: z.string().optional(),
  businessContext: z.string().optional(),
  productCategory: z.string().optional(),
  competitorUrls: z.string().optional(),
  customPrompt: z.string().optional()
});

const keywordResearchSchema = z.object({
  seedKeywords: z.string().min(1, "Seed keywords are required"),
  language: z.string().min(1, "Language is required"),
  industry: z.string().default("chemical"),
  targetMarket: z.string().optional()
});

const contentOptimizationSchema = z.object({
  content: z.string().min(1, "Content is required"),
  targetKeywords: z.string().min(1, "Target keywords are required"),
  language: z.string().min(1, "Language is required")
});

const seoAnalysisSchema = z.object({
  url: z.string().url("Valid URL is required"),
  targetKeywords: z.string().min(1, "Target keywords are required")
});

export default function AiSeoAssistant() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Forms
  const contentForm = useForm<z.infer<typeof aiContentGenerationSchema>>({
    resolver: zodResolver(aiContentGenerationSchema),
    defaultValues: {
      pageType: "",
      language: selectedLanguage,
      targetKeywords: "",
      businessContext: "Momtazchem - Leading chemical products company in Iraq and Middle East",
      productCategory: "",
      competitorUrls: "",
      customPrompt: ""
    }
  });

  const keywordForm = useForm<z.infer<typeof keywordResearchSchema>>({
    resolver: zodResolver(keywordResearchSchema),
    defaultValues: {
      seedKeywords: "",
      language: selectedLanguage,
      industry: "chemical",
      targetMarket: "Iraq, Middle East"
    }
  });

  const optimizationForm = useForm<z.infer<typeof contentOptimizationSchema>>({
    resolver: zodResolver(contentOptimizationSchema),
    defaultValues: {
      content: "",
      targetKeywords: "",
      language: selectedLanguage
    }
  });

  const analysisForm = useForm<z.infer<typeof seoAnalysisSchema>>({
    resolver: zodResolver(seoAnalysisSchema),
    defaultValues: {
      url: "",
      targetKeywords: ""
    }
  });

  // AI Mutations
  const generateAiContent = useMutation({
    mutationFn: async (data: z.infer<typeof aiContentGenerationSchema>) => {
      setIsGenerating(true);
      const keywords = data.targetKeywords ? data.targetKeywords.split(',').map(k => k.trim()) : [];
      const competitors = data.competitorUrls ? data.competitorUrls.split(',').map(u => u.trim()) : [];
      
      return apiRequest('/api/ai/seo/generate', {
        method: 'POST',
        body: {
          pageType: data.pageType,
          language: data.language,
          targetKeywords: keywords,
          competitorUrls: competitors,
          businessContext: data.businessContext,
          productCategory: data.productCategory,
          customPrompt: data.customPrompt
        }
      });
    },
    onSuccess: (result) => {
      setAiResults({ type: 'content', data: result.data });
      setIsGenerating(false);
      toast({ 
        title: "✨ AI Content Generated Successfully", 
        description: "Your SEO-optimized content is ready!" 
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI content",
        variant: "destructive"
      });
    }
  });

  const researchKeywords = useMutation({
    mutationFn: async (data: z.infer<typeof keywordResearchSchema>) => {
      setIsGenerating(true);
      const seedKeywords = data.seedKeywords.split(',').map(k => k.trim());
      
      return apiRequest('/api/ai/seo/keywords', {
        method: 'POST',
        body: {
          seedKeywords,
          language: data.language,
          industry: data.industry,
          targetMarket: data.targetMarket
        }
      });
    },
    onSuccess: (result) => {
      setAiResults({ type: 'keywords', data: result.data });
      setIsGenerating(false);
      toast({ 
        title: "🔍 Keyword Research Complete", 
        description: "Advanced keyword suggestions generated!" 
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Research Failed",
        description: error.message || "Failed to research keywords",
        variant: "destructive"
      });
    }
  });

  const optimizeContent = useMutation({
    mutationFn: async (data: z.infer<typeof contentOptimizationSchema>) => {
      setIsGenerating(true);
      const keywords = data.targetKeywords.split(',').map(k => k.trim());
      
      return apiRequest('/api/ai/seo/optimize', {
        method: 'POST',
        body: {
          content: data.content,
          targetKeywords: keywords,
          language: data.language
        }
      });
    },
    onSuccess: (result) => {
      setAiResults({ type: 'optimization', data: result.data });
      setIsGenerating(false);
      toast({ 
        title: "⚡ Content Optimized", 
        description: "Your content has been SEO-optimized!" 
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize content",
        variant: "destructive"
      });
    }
  });

  const analyzePerformance = useMutation({
    mutationFn: async (data: z.infer<typeof seoAnalysisSchema>) => {
      setIsGenerating(true);
      const keywords = data.targetKeywords.split(',').map(k => k.trim());
      
      return apiRequest('/api/ai/seo/analyze', {
        method: 'POST',
        body: {
          url: data.url,
          targetKeywords: keywords
        }
      });
    },
    onSuccess: (result) => {
      setAiResults({ type: 'analysis', data: result.data });
      setIsGenerating(false);
      toast({ 
        title: "📊 Analysis Complete", 
        description: "SEO performance analysis finished!" 
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze SEO performance",
        variant: "destructive"
      });
    }
  });

  const pageTypes = [
    { value: "homepage", label: "Homepage" },
    { value: "product", label: "Product Page" },
    { value: "category", label: "Category Page" },
    { value: "about", label: "About Us" },
    { value: "contact", label: "Contact" },
    { value: "blog", label: "Blog Post" },
    { value: "service", label: "Service Page" }
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic" },
    { value: "ku", label: "Kurdish" },
    { value: "tr", label: "Turkish" }
  ];

  const renderResults = () => {
    if (!aiResults) return null;

    const { type, data } = aiResults;

    switch (type) {
      case 'content':
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generated SEO Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-semibold">Title:</label>
                <p className="bg-gray-50 p-2 rounded mt-1">{data.title}</p>
              </div>
              <div>
                <label className="font-semibold">Meta Description:</label>
                <p className="bg-gray-50 p-2 rounded mt-1">{data.description}</p>
              </div>
              <div>
                <label className="font-semibold">Focus Keyword:</label>
                <Badge variant="secondary" className="ml-2">{data.focusKeyword}</Badge>
              </div>
              <div>
                <label className="font-semibold">Keywords:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.keywords?.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">AI Reasoning:</label>
                <p className="bg-blue-50 p-3 rounded mt-1 text-sm">{data.reasoning}</p>
              </div>
              <div>
                <label className="font-semibold">Suggestions:</label>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {data.suggestions?.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'keywords':
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Keyword Research Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-semibold">Primary Keywords:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.primaryKeywords?.map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-green-100 text-green-800">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">Long-Tail Keywords:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.longTailKeywords?.map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">Local Keywords:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.localKeywords?.map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-yellow-100 text-yellow-800">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">Competitor Keywords:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.competitorKeywords?.map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-red-100 text-red-800">{keyword}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'optimization':
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Content Optimization Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Keyword Density:</label>
                  <Badge variant="secondary" className="ml-2">{data.keywordDensity}%</Badge>
                </div>
                <div>
                  <label className="font-semibold">Readability Score:</label>
                  <Badge variant="secondary" className="ml-2">{data.readabilityScore}/100</Badge>
                </div>
              </div>
              <div>
                <label className="font-semibold">Optimized Content:</label>
                <div className="bg-gray-50 p-3 rounded mt-1 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{data.optimizedContent}</pre>
                </div>
              </div>
              <div>
                <label className="font-semibold">Optimization Suggestions:</label>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {data.suggestions?.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'analysis':
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                SEO Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.titleScore}/100</div>
                  <div className="text-sm text-gray-600">Title Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.descriptionScore}/100</div>
                  <div className="text-sm text-gray-600">Description Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data.keywordDensity}%</div>
                  <div className="text-sm text-gray-600">Keyword Density</div>
                </div>
              </div>
              <div>
                <label className="font-semibold">Recommendations:</label>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {data.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {user?.id === 7 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/site-management")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site Management
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              AI SEO Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Powered by GPT-4o for advanced SEO optimization and content generation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            AI-Powered
          </Badge>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">4o</div>
                <div className="text-sm text-gray-600">GPT Model</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">Iraq</div>
                <div className="text-sm text-gray-600">Target Market</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">Chemical</div>
                <div className="text-sm text-gray-600">Industry Expert</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main AI Tools */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Research Keywords
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Optimize Content
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyze Performance
          </TabsTrigger>
        </TabsList>

        {/* Content Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                AI Content Generation
              </CardTitle>
              <CardDescription>
                Generate SEO-optimized titles, descriptions, and meta tags using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...contentForm}>
                <form onSubmit={contentForm.handleSubmit((data) => generateAiContent.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={contentForm.control}
                      name="pageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select page type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pageTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contentForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={contentForm.control}
                    name="targetKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Keywords (comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="chemical products, industrial solutions, Iraq" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Paint Thinners, Fuel Additives, Water Treatment" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="businessContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Context</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional context about your business, products, or target audience" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="customPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom AI Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any specific instructions for the AI..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-spin" />
                        Generating AI Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate SEO Content
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keyword Research Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-500" />
                AI Keyword Research
              </CardTitle>
              <CardDescription>
                Discover high-impact keywords for your chemical products and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...keywordForm}>
                <form onSubmit={keywordForm.handleSubmit((data) => researchKeywords.mutate(data))} className="space-y-4">
                  <FormField
                    control={keywordForm.control}
                    name="seedKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seed Keywords *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="paint thinner, chemical solutions, industrial cleaning" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={keywordForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={keywordForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={keywordForm.control}
                    name="targetMarket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Market</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Iraq, Middle East, Gulf Region" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-spin" />
                        Researching Keywords...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Research Keywords
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Optimization Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                AI Content Optimization
              </CardTitle>
              <CardDescription>
                Optimize existing content for better SEO performance and readability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...optimizationForm}>
                <form onSubmit={optimizationForm.handleSubmit((data) => optimizeContent.mutate(data))} className="space-y-4">
                  <FormField
                    control={optimizationForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content to Optimize *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Paste your content here for AI optimization..."
                            className="min-h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={optimizationForm.control}
                      name="targetKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Keywords *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="main keyword, secondary keyword" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={optimizationForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-spin" />
                        Optimizing Content...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Optimize Content
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                AI SEO Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights on your website's SEO performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...analysisForm}>
                <form onSubmit={analysisForm.handleSubmit((data) => analyzePerformance.mutate(data))} className="space-y-4">
                  <FormField
                    control={analysisForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.momtazchem.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={analysisForm.control}
                    name="targetKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Keywords *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="chemical products, paint thinner, industrial solutions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing SEO Performance...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Analyze SEO Performance
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {renderResults()}
    </div>
  );
}