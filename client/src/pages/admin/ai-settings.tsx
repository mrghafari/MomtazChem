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

  // Test AI Connection
  const testAIMutation = useMutation({
    mutationFn: () => apiRequest("/api/ai/test-connection", "POST"),
    onSuccess: (result) => {
      toast({
        title: "✅ اتصال موفق",
        description: `OpenAI API متصل شد. مدل: ${result.model}`,
      });
    },
    onError: () => {
      toast({
        title: "❌ خطا در اتصال",
        description: "امکان اتصال به OpenAI API وجود ندارد",
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin/site-management")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت به مدیریت سایت
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bot className="w-8 h-8 text-purple-600" />
                تنظیمات هوش مصنوعی
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                مدیریت و پیکربندی سیستم‌های هوش مصنوعی OpenAI
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Sparkles className="w-4 h-4 mr-1" />
            فعال
          </Badge>
        </div>

        {/* AI Settings Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">تنظیمات کلی</TabsTrigger>
            <TabsTrigger value="sku">تولید SKU</TabsTrigger>
            <TabsTrigger value="performance">عملکرد</TabsTrigger>
            <TabsTrigger value="testing">آزمایش</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  تنظیمات اصلی OpenAI
                </CardTitle>
                <CardDescription>
                  پیکربندی اتصال و پارامترهای اصلی هوش مصنوعی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="model">مدل OpenAI</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gpt-4o"
                    />
                    <p className="text-sm text-gray-500">مدل پیش‌فرض: gpt-4o (آخرین نسخه)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">حداکثر توکن</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      placeholder="1000"
                    />
                    <p className="text-sm text-gray-500">تعداد حداکثر توکن‌های پاسخ</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="temperature">دمای تولید (Temperature)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="0.7"
                    />
                    <p className="text-sm text-gray-500">کنترل خلاقیت پاسخ‌ها (0-2)</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>فعال‌سازی ماژول‌ها</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-enabled" className="text-sm">هوش مصنوعی کلی</Label>
                        <Switch
                          id="ai-enabled"
                          checked={aiEnabled}
                          onCheckedChange={setAiEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sku-generation" className="text-sm">تولید SKU هوشمند</Label>
                        <Switch
                          id="sku-generation"
                          checked={skuGeneration}
                          onCheckedChange={setSkuGeneration}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smart-recommendations" className="text-sm">پیشنهادات هوشمند</Label>
                        <Switch
                          id="smart-recommendations"
                          checked={smartRecommendations}
                          onCheckedChange={setSmartRecommendations}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  ذخیره تنظیمات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SKU Generation Settings */}
          <TabsContent value="sku" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  تولید SKU هوشمند
                </CardTitle>
                <CardDescription>
                  پیکربندی سیستم تولید خودکار کد محصول (SKU) با هوش مصنوعی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">روش تولید SKU</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        سیستم هوش مصنوعی بر اساس این پارامترها SKU تولید می‌کند:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 mr-4">
                        <li>• نام محصول</li>
                        <li>• دسته‌بندی محصول</li>
                        <li>• توضیحات فنی</li>
                        <li>• ویژگی‌ها و مشخصات</li>
                        <li>• کاربردهای محصول</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">قالب‌های SKU</h3>
                    <div className="space-y-2">
                      <Badge variant="outline">CC-PRD-001</Badge>
                      <Badge variant="outline">LAB-CHM-145</Badge>
                      <Badge variant="outline">PHR-MED-087</Badge>
                      <p className="text-sm text-gray-600">
                        نمونه‌هایی از SKU های تولید شده توسط هوش مصنوعی
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">تنظیمات پیشرفته</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku-prefix">پیشوند پیش‌فرض</Label>
                      <Input
                        id="sku-prefix"
                        placeholder="MZTC"
                        defaultValue="MZTC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku-length">طول کد تولیدی</Label>
                      <Input
                        id="sku-length"
                        type="number"
                        placeholder="8"
                        defaultValue="8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  عملکرد و آمار
                </CardTitle>
                <CardDescription>
                  نظارت بر عملکرد سیستم‌های هوش مصنوعی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">SKU های تولید شده</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">247</div>
                      <p className="text-xs text-gray-500">در ماه گذشته</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">میانگین زمان پاسخ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">1.2s</div>
                      <p className="text-xs text-gray-500">زمان متوسط</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">نرخ موفقیت</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">98.5%</div>
                      <Progress value={98.5} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">مصرف منابع</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>مصرف توکن ماهانه</span>
                        <span>15,240 / 50,000</span>
                      </div>
                      <Progress value={30.48} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>تعداد درخواست‌ها</span>
                        <span>1,847 / 10,000</span>
                      </div>
                      <Progress value={18.47} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  آزمایش و تست
                </CardTitle>
                <CardDescription>
                  آزمایش عملکرد سیستم‌های هوش مصنوعی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تست اتصال OpenAI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        بررسی وضعیت اتصال به OpenAI API
                      </p>
                      <Button
                        onClick={() => testAIMutation.mutate()}
                        disabled={testAIMutation.isPending}
                        className="w-full"
                      >
                        {testAIMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 mr-2" />
                            تست اتصال
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تست تولید SKU</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        آزمایش تولید SKU با داده‌های نمونه
                      </p>
                      <Button
                        onClick={() => generateTestSKUMutation.mutate()}
                        disabled={generateTestSKUMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        {generateTestSKUMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 mr-2" />
                            تولید SKU تست
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">لاگ‌های سیستم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      <div className="text-sm text-green-600">✅ 08:30:12 - SKU generated successfully: MZTC-CC-001</div>
                      <div className="text-sm text-blue-600">ℹ️ 08:29:45 - OpenAI API connection established</div>
                      <div className="text-sm text-green-600">✅ 08:25:33 - Product recommendation generated</div>
                      <div className="text-sm text-orange-600">⚠️ 08:20:15 - High token usage detected</div>
                      <div className="text-sm text-green-600">✅ 08:15:02 - SKU validation completed</div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}