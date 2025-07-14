import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bot, Zap, Settings, Activity, TrendingUp, Save, TestTube, Sparkles, Brain, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AISettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [skuGeneration, setSkuGeneration] = useState(true);
  const [smartRecommendations, setSmartRecommendations] = useState(true);
  const [maxTokens, setMaxTokens] = useState("1000");
  const [temperature, setTemperature] = useState("0.7");
  const [model, setModel] = useState("gpt-4o");
  const [apiProvider, setApiProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [organization, setOrganization] = useState("");
  const [project, setProject] = useState("");
  const [secretKey, setSecretKey] = useState("");

  // Save AI Settings
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("/api/ai/settings", "POST", settings),
    onSuccess: () => {
      toast({
        title: "✅ ذخیره موفق",
        description: "تنظیمات AI با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطا در ذخیره",
        description: "امکان ذخیره تنظیمات وجود ندارد",
        variant: "destructive",
      });
    },
  });

  // Test AI Connection
  const testAIMutation = useMutation({
    mutationFn: () => apiRequest("/api/ai/test-connection", "POST"),
    onSuccess: (result) => {
      toast({
        title: "✅ اتصال موفق",
        description: `API متصل شد. مدل: ${result.model}`,
      });
    },
    onError: () => {
      toast({
        title: "❌ خطا در اتصال",
        description: "امکان اتصال به API وجود ندارد",
        variant: "destructive",
      });
    },
  });

  // Generate Test SKU
  const generateTestSKUMutation = useMutation({
    mutationFn: () => apiRequest("/api/products/generate-sku", "POST", {
      name: "محصول تست",
      category: "commercial",
      description: "این یک محصول تست برای آزمایش تولید SKU است"
    }),
    onSuccess: (result) => {
      toast({
        title: "🤖 SKU تولید شد",
        description: `SKU تست: ${result.data.sku}`,
      });
    },
    onError: () => {
      toast({
        title: "خطا در تولید SKU",
        description: "امکان تولید SKU تست وجود ندارد",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings = {
      aiEnabled,
      skuGeneration,
      smartRecommendations,
      maxTokens: parseInt(maxTokens),
      temperature: parseFloat(temperature),
      model,
      apiProvider,
      apiKey,
      organization,
      project,
      secretKey,
    };
    saveSettingsMutation.mutate(settings);
  };

  const getModelOptions = () => {
    if (apiProvider === "openai") {
      return [
        { value: "gpt-4o", label: "GPT-4o (جدیدترین)" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { value: "gpt-4", label: "GPT-4" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      ];
    } else if (apiProvider === "deepseek") {
      return [
        { value: "deepseek-chat", label: "DeepSeek Chat" },
        { value: "deepseek-coder", label: "DeepSeek Coder" },
        { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {user?.id === 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/admin")}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>بازگشت به داشبورد</span>
              </Button>
            )}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تنظیمات پیشرفته AI</h1>
                <p className="text-gray-600 dark:text-gray-400">مدیریت هوش مصنوعی و API</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Settings className="h-4 w-4" />
              <span>تنظیمات کلی</span>
            </TabsTrigger>
            <TabsTrigger value="sku" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Bot className="h-4 w-4" />
              <span>تولید SKU</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="h-4 w-4" />
              <span>عملکرد</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2 rtl:space-x-reverse">
              <TestTube className="h-4 w-4" />
              <span>آزمایش</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Settings className="h-5 w-5" />
                  <span>تنظیمات عمومی AI</span>
                </CardTitle>
                <CardDescription>
                  پیکربندی اصلی سیستم هوش مصنوعی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Provider Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    انتخاب ارائه‌دهنده AI
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiProvider">ارائه‌دهنده API</Label>
                      <Select value={apiProvider} onValueChange={setApiProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب ارائه‌دهنده" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">مدل AI</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب مدل" />
                        </SelectTrigger>
                        <SelectContent>
                          {getModelOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    پیکربندی API
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">
                        {apiProvider === "openai" ? "OpenAI API Key" : "DeepSeek API Key"}
                      </Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={apiProvider === "openai" ? "sk-..." : "ds-..."}
                        className="font-mono"
                      />
                      <p className="text-sm text-gray-500">
                        کلید API برای دسترسی به سرویس‌های {apiProvider === "openai" ? "OpenAI" : "DeepSeek"}
                      </p>
                    </div>
                    
                    {apiProvider === "openai" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="organization">Organization ID (اختیاری)</Label>
                          <Input
                            id="organization"
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder="org-..."
                            className="font-mono"
                          />
                          <p className="text-sm text-gray-500">شناسه سازمان در OpenAI</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="project">Project ID (اختیاری)</Label>
                          <Input
                            id="project"
                            type="text"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            placeholder="proj_..."
                            className="font-mono"
                          />
                          <p className="text-sm text-gray-500">شناسه پروژه در OpenAI</p>
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="secretKey">Secret Key (اختیاری)</Label>
                      <Input
                        id="secretKey"
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="کلید امنیتی اضافی"
                        className="font-mono"
                      />
                      <p className="text-sm text-gray-500">کلید امنیتی اضافی برای تأیید هویت</p>
                    </div>
                  </div>
                </div>

                {/* Model Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    پارامترهای مدل
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">حداکثر توکن</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(e.target.value)}
                        min="100"
                        max="4000"
                      />
                      <p className="text-sm text-gray-500">تعداد حداکثر توکن‌های تولیدی</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">دما (Temperature)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        min="0"
                        max="2"
                        step="0.1"
                      />
                      <p className="text-sm text-gray-500">کنترل خلاقیت پاسخ‌ها (0-2)</p>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    فعال‌سازی ویژگی‌ها
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>هوش مصنوعی فعال</Label>
                        <p className="text-sm text-gray-500">فعال یا غیرفعال کردن کل سیستم AI</p>
                      </div>
                      <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>تولید هوشمند SKU</Label>
                        <p className="text-sm text-gray-500">تولید خودکار SKU برای محصولات جدید</p>
                      </div>
                      <Switch checked={skuGeneration} onCheckedChange={setSkuGeneration} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>توصیه‌های هوشمند</Label>
                        <p className="text-sm text-gray-500">پیشنهاد محصولات بر اساس AI</p>
                      </div>
                      <Switch checked={smartRecommendations} onCheckedChange={setSmartRecommendations} />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="flex items-center space-x-2 rtl:space-x-reverse"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saveSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SKU Generation Tab */}
          <TabsContent value="sku" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Bot className="h-5 w-5" />
                  <span>تولید هوشمند SKU</span>
                </CardTitle>
                <CardDescription>
                  تنظیمات و آزمایش تولید SKU با AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    نحوه کارکرد تولید SKU
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    سیستم AI بر اساس نام، دسته‌بندی و توضیحات محصول، یک SKU منحصربه‌فرد تولید می‌کند.
                    این فرآیند شامل تحلیل محتوا، استخراج کلیدواژه‌ها و ایجاد کد استاندارد است.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Activity className="h-5 w-5" />
                  <span>عملکرد سیستم AI</span>
                </CardTitle>
                <CardDescription>
                  مانیتورینگ و آمار استفاده از API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">درخواست‌های موفق</p>
                        <p className="text-2xl font-bold">1,234</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">توکن‌های مصرفی</p>
                        <p className="text-2xl font-bold">45.2K</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">زمان پاسخ متوسط</p>
                        <p className="text-2xl font-bold">1.2s</p>
                      </div>
                      <Sparkles className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TestTube className="h-5 w-5" />
                  <span>آزمایش عملکرد</span>
                </CardTitle>
                <CardDescription>
                  تست اتصال و عملکرد سیستم AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تست اتصال API</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => testAIMutation.mutate()}
                        disabled={testAIMutation.isPending}
                        className="w-full"
                      >
                        {testAIMutation.isPending ? "در حال آزمایش..." : "آزمایش اتصال"}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تست تولید SKU</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => generateTestSKUMutation.mutate()}
                        disabled={generateTestSKUMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        {generateTestSKUMutation.isPending ? "در حال تولید..." : "تولید SKU تست"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}