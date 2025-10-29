import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Eye, RefreshCw, Star, Zap, Shield, CreditCard, Package, Bell, Settings, MessageSquare, ShoppingCart, Monitor, Key, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  language: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

// Actual database template categories (from database query result)
const TEMPLATE_CATEGORIES = {
  technical_support: { 
    name: 'پشتیبانی فنی', 
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Settings,
    description: 'قالب‌های مربوط به پشتیبانی فنی و محصولات'
  },
  product_info: { 
    name: 'اطلاعات محصول', 
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    icon: Package,
    description: 'قالب‌های اطلاعات محصولات و مشخصات فنی'
  },
  general: { 
    name: 'عمومی', 
    color: 'bg-gray-50 border-gray-200 text-gray-800',
    icon: Mail,
    description: 'قالب‌های عمومی و متنوع'
  },
  inquiry_response: { 
    name: 'پاسخ استعلام', 
    color: 'bg-teal-50 border-teal-200 text-teal-800',
    icon: MessageSquare,
    description: 'قالب‌های پاسخ به استعلامات'
  },
  inquiry: { 
    name: 'استعلامات', 
    color: 'bg-green-50 border-green-200 text-green-800',
    icon: Mail,
    description: 'قالب‌های استعلامات مشتریان - شامل Template #05'
  },
  admin: { 
    name: 'مدیریتی', 
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    icon: Shield,
    description: 'قالب‌های مدیریت کاربران و رمز عبور'
  },
  notifications: { 
    name: 'اعلان‌ها', 
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: Bell,
    description: 'قالب‌های اعلان‌ها و اطلاع‌رسانی'
  },
  orders: { 
    name: 'سفارشات', 
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    icon: ShoppingCart,
    description: 'قالب‌های مربوط به سفارشات'
  },
  inventory_alerts: { 
    name: 'هشدار موجودی', 
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: Package,
    description: 'قالب‌های هشدار موجودی و انبار'
  },
  payment_notifications: { 
    name: 'اعلان پرداخت', 
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CreditCard,
    description: 'قالب‌های تایید پرداخت و مالی'
  },
  system_notifications: { 
    name: 'اعلان سیستم', 
    color: 'bg-slate-50 border-slate-200 text-slate-800',
    icon: Monitor,
    description: 'قالب‌های اعلان‌های سیستم'
  },
  security_alerts: { 
    name: 'هشدار امنیتی', 
    color: 'bg-red-50 border-red-200 text-red-800',
    icon: Shield,
    description: 'قالب‌های هشدار امنیتی'
  },
  'password-reset': { 
    name: 'بازیابی رمز عبور', 
    color: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: Key,
    description: 'قالب‌های بازیابی رمز عبور'
  },
  notification: { 
    name: 'اطلاع‌رسانی', 
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: Bell,
    description: 'قالب‌های اطلاع‌رسانی عمومی'
  }
};

// Complete registry of all 17 templates from EMAIL_TEMPLATES_GUIDE.md
const TEMPLATE_REGISTRY = {
  '#01': { 
    category: 'technical_support', 
    ref: 'TPL-001', 
    usage: 'Technical Support Response',
    autoUse: false,
    priority: 'medium'
  },
  '#02': { 
    category: 'product_info', 
    ref: 'TPL-002', 
    usage: 'Product Information Response',
    autoUse: false,
    priority: 'medium'
  },
  '#03': { 
    category: 'inquiry_response', 
    ref: 'TPL-003', 
    usage: 'General Inquiry Response',
    autoUse: false,
    priority: 'medium'
  },
  '#04': { 
    category: 'inquiry_response', 
    ref: 'TPL-004', 
    usage: 'قالب پاسخ استعلام - طراحی زیبا و حرفه‌ای',
    autoUse: false,
    priority: 'medium'
  },
  '#05': { 
    category: 'inquiry', 
    ref: 'TPL-005', 
    usage: 'Momtaz Chemical Follow-up Response',
    autoUse: true,
    priority: 'high'
  },
  '#06': { 
    category: 'password-reset', 
    ref: 'TPL-006', 
    usage: 'Password Management Template',
    autoUse: true,
    priority: 'high'
  },
  '#07': { 
    category: 'notifications', 
    ref: 'TPL-007', 
    usage: 'Product Inquiry Admin Notification',
    autoUse: false,
    priority: 'medium'
  },
  '#08': { 
    category: 'notifications', 
    ref: 'TPL-008', 
    usage: 'Customer Inquiry Confirmation',
    autoUse: false,
    priority: 'medium'
  },
  '#09': { 
    category: 'notifications', 
    ref: 'TPL-009', 
    usage: 'Sales Inquiry Notification',
    autoUse: false,
    priority: 'medium'
  },
  '#10': { 
    category: 'notifications', 
    ref: 'TPL-010', 
    usage: 'Quote Request Notification',
    autoUse: false,
    priority: 'medium'
  },
  '#11': { 
    category: 'admin', 
    ref: 'TPL-011', 
    usage: 'Generated Password Notification (Persian)',
    autoUse: false,
    priority: 'medium'
  },
  '#12': { 
    category: 'admin', 
    ref: 'TPL-012', 
    usage: 'Admin Password Reset (Persian)',
    autoUse: false,
    priority: 'medium'
  },
  '#13': { 
    category: 'inventory_alerts', 
    ref: 'TPL-013', 
    usage: 'Low Stock Alert (Universal Service)',
    autoUse: true,
    priority: 'high'
  },
  '#14': { 
    category: 'payment_notifications', 
    ref: 'TPL-014', 
    usage: 'Payment Confirmation',
    autoUse: false,
    priority: 'medium'
  },
  '#15': { 
    category: 'system_notifications', 
    ref: 'TPL-015', 
    usage: 'System Notification',
    autoUse: false,
    priority: 'medium'
  },
  '#16': { 
    category: 'security_alerts', 
    ref: 'TPL-016', 
    usage: 'Security Alert',
    autoUse: false,
    priority: 'high'
  },
  '#17': { 
    category: 'inventory_alerts', 
    ref: 'TPL-017', 
    usage: 'Comprehensive Inventory Alert System',
    autoUse: true,
    priority: 'high'
  }
};

const EmailTemplatesCentral: React.FC = () => {
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateData: Partial<EmailTemplate> & { id: number }) => {
      const response = await fetch(`/api/email/templates/${templateData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'خطا در بروزرسانی قالب');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates-database'] });
      toast({
        title: "✅ بروزرسانی موفق",
        description: "قالب ایمیل با موفقیت بروزرسانی شد",
      });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در بروزرسانی",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
    }
  });

  // Fetch templates directly from database without authentication
  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['email-templates-database'],
    queryFn: async () => {
      try {
        console.log('🔍 [EMAIL TEMPLATES] Fetching templates directly from database...');
        
        // Direct database query to get all templates exactly as they exist
        const response = await fetch('/api/email/templates/public', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('❌ Database query failed, status:', response.status);
          // Fallback: return empty array instead of throwing error
          return [];
        }
        
        const data = await response.json();
        console.log('✅ [EMAIL TEMPLATES] Database templates loaded:', {
          count: Array.isArray(data) ? data.length : 0,
          templates: Array.isArray(data) ? data.map(t => ({ id: t.id, name: t.name, category: t.category })) : []
        });
        
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('⚠️ [EMAIL TEMPLATES] Database error, returning empty:', error);
        return []; // Always return empty array instead of failing
      }
    },
    staleTime: 10000,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false // Don't retry on error, just return empty
  });

  // Get template number from name
  const getTemplateNumber = (name: string): string => {
    const match = name.match(/#(\d+)/);
    return match ? `#${match[1]}` : '';
  };

  // Get template info from registry
  const getTemplateInfo = (name: string) => {
    const number = getTemplateNumber(name);
    return TEMPLATE_REGISTRY[number] || { 
      category: 'notification', 
      ref: 'TPL-XXX', 
      usage: 'Unknown Template',
      autoUse: false,
      priority: 'low'
    };
  };

  // Filter templates by actual database category (not registry mapping)
  const filteredTemplates = selectedCategory === 'all' 
    ? (Array.isArray(templates) ? templates : [])
    : (Array.isArray(templates) ? templates.filter(template => template.category === selectedCategory) : []);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [EMAIL TEMPLATES] Templates data:', templates);
    console.log('🔍 [EMAIL TEMPLATES] Templates array:', Array.isArray(templates), templates?.length);
    console.log('🔍 [EMAIL TEMPLATES] Selected category:', selectedCategory);
    console.log('🔍 [EMAIL TEMPLATES] Filtered templates:', filteredTemplates);
    console.log('🔍 [EMAIL TEMPLATES] Filtered length:', filteredTemplates.length);
    console.log('🔍 [EMAIL TEMPLATES] Is loading:', isLoading);
    console.log('🔍 [EMAIL TEMPLATES] Error:', error);
    
    // Debug template filtering
    if (Array.isArray(templates) && templates.length > 0) {
      console.log('🔍 [EMAIL TEMPLATES] Sample template structure:', templates[0]);
      templates.forEach((template, index) => {
        const templateNumber = getTemplateNumber(template.name);
        const templateInfo = getTemplateInfo(template.name);
        console.log(`🔍 [EMAIL TEMPLATES] Template ${index + 1}:`, {
          name: template.name,
          templateNumber,
          category: templateInfo.category,
          inRegistry: !!TEMPLATE_REGISTRY[templateNumber]
        });
      });
    }
  }, [templates, selectedCategory, filteredTemplates, isLoading, error]);

  // Get category stats - use actual database category, not registry
  const getCategoryStats = (categoryKey: string) => {
    if (!Array.isArray(templates)) return { total: 0, active: 0, autoUse: 0 };
    
    // Filter by actual database category
    const categoryTemplates = templates.filter(template => template.category === categoryKey);
    
    return {
      total: categoryTemplates.length,
      active: categoryTemplates.filter(t => t.is_active).length,
      autoUse: categoryTemplates.filter(t => {
        const templateNumber = getTemplateNumber(t.name);
        const info = TEMPLATE_REGISTRY[templateNumber];
        return info?.autoUse || false;
      }).length
    };
  };

  const handleRefresh = async () => {
    console.log('🔄 [EMAIL TEMPLATES] Manual refresh triggered');
    try {
      await refetch();
      toast({
        title: "✅ بروزرسانی موفق",
        description: `${Array.isArray(templates) ? templates.length : 0} قالب از دیتابیس بارگذاری شد`,
      });
    } catch (error) {
      console.error('❌ [EMAIL TEMPLATES] Refresh failed:', error);
      toast({
        title: "❌ خطا در بروزرسانی",
        description: error.message?.includes('Authentication') 
          ? "لطفاً ابتدا وارد حساب مدیریت شوید" 
          : "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری قالب‌های ایمیل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.message?.includes('Authentication required');
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className={isAuthError ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}>
            <CardContent className="p-6 text-center">
              {isAuthError ? (
                <>
                  <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">نیاز به احراز هویت</h3>
                  <p className="text-orange-700 mb-4">
                    برای مشاهده قالب‌های ایمیل، لطفاً ابتدا وارد حساب مدیریت شوید
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => setLocation('/admin/login')} 
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      ورود به حساب مدیریت
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" className="text-orange-600 border-orange-300">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      تلاش مجدد
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-red-700 mb-4">خطا در بارگذاری قالب‌های ایمیل: {error.message}</p>
                  <Button onClick={handleRefresh} variant="outline" className="text-red-600 border-red-300">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    تلاش مجدد
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 مرکز قالب‌های ایمیل</h1>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                بروزرسانی ({Array.isArray(templates) ? templates.length : 0})
              </Button>
            </div>
          </div>
        </div>

        {/* Template #05 Special Highlight */}
        {Array.isArray(templates) && templates.find(t => t.name === '#05 - Momtaz Chemical Follow-up Response') && (
          <div className="mb-6">
            <Card className="border-green-300 bg-green-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Template #05 - Momtaz Chemical Follow-up Response
                  <Badge variant="default" className="bg-green-600 text-white">
                    ⭐ قالب برتر
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    استفاده خودکار
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                    <h4 className="text-sm font-bold text-green-800 mb-2">✨ ویژگی‌ها:</h4>
                    <div className="space-y-1 text-xs text-green-700">
                      <div>✅ بخش "پاسخ ما" با پس‌زمینه سبز</div>
                      <div>✅ بخش "درخواست شما" با پس‌زمینه آبی</div>
                      <div>✅ شماره تلفن: +964 770 999 6771</div>
                      <div>✅ وب‌سایت: www.momtazchem.com</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">📋 کاربرد:</h4>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div>• پیگیری استعلامات مشتریان</div>
                      <div>• ارتباط مجدد با مشتریان</div>
                      <div>• استفاده خودکار در سیستم</div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">🔧 متغیرها:</h4>
                    <div className="text-xs text-yellow-700">
                      {`{{customer_name}}, {{inquiry_number}}, {{response_text}}, {{inquiry_subject}}, {{inquiry_category}}`}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <a 
                    href="/admin/template05-static" 
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    🎨 مشاهده کامل Template #05
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(Array.isArray(templates) ? templates.find(t => t.name === '#05 - Momtaz Chemical Follow-up Response') || null : null)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    پیش‌نمایش
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Filter Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1 h-auto p-1">
            <TabsTrigger value="all" className="text-xs">
              همه ({Array.isArray(templates) ? templates.length : 0})
            </TabsTrigger>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
              const stats = getCategoryStats(key);
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={key} value={key} className="text-xs flex flex-col gap-1 p-2">
                  <IconComponent className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className="text-xs opacity-70">({stats.total})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Category Descriptions */}
          {selectedCategory !== 'all' && TEMPLATE_CATEGORIES[selectedCategory] && (
            <div className="mt-4">
              <Card className={`border ${TEMPLATE_CATEGORIES[selectedCategory].color.replace('text-', 'border-').replace('-800', '-200')}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {React.createElement(TEMPLATE_CATEGORIES[selectedCategory].icon, { className: "w-5 h-5" })}
                    <h3 className="font-semibold">{TEMPLATE_CATEGORIES[selectedCategory].name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{TEMPLATE_CATEGORIES[selectedCategory].description}</p>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span>کل: {getCategoryStats(selectedCategory).total}</span>
                    <span>فعال: {getCategoryStats(selectedCategory).active}</span>
                    <span>خودکار: {getCategoryStats(selectedCategory).autoUse}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const templateInfo = getTemplateInfo(template.name);
            const category = TEMPLATE_CATEGORIES[templateInfo.category];
            const templateNumber = getTemplateNumber(template.name);
            const isSpecial = ['#05', '#13', '#17'].includes(templateNumber);
            
            return (
              <Card 
                key={template.id} 
                className={`hover:shadow-md transition-shadow ${
                  isSpecial ? 'border-green-300 bg-green-50 shadow-lg' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-lg mb-2 ${isSpecial ? 'text-green-800' : ''}`}>
                        {template.name}
                        {isSpecial && (
                          <span className="block text-sm text-green-600 font-normal mt-1">
                            ⭐ استفاده خودکار در سیستم
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={category?.color || 'bg-gray-50 border-gray-200 text-gray-800'}
                        >
                          {category?.name || 'عمومی'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {templateInfo.ref}
                        </Badge>
                        {templateInfo.autoUse && (
                          <Badge variant="default" className="bg-orange-600 text-white">
                            <Zap className="w-3 h-3 mr-1" />
                            خودکار
                          </Badge>
                        )}
                        {templateInfo.priority === 'high' && (
                          <Badge variant="default" className="bg-red-600 text-white">
                            اولویت بالا
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className={isSpecial ? 'hover:bg-green-100' : ''}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                        className={isSpecial ? 'hover:bg-green-100' : ''}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">موضوع:</p>
                      <p className={`text-sm p-2 rounded ${
                        isSpecial ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-50'
                      }`}>
                        {template.subject}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">کاربرد:</p>
                      <p className="text-sm text-gray-600">{templateInfo.usage}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>زبان: {template.language || 'فارسی'}</span>
                      <span>استفاده: {template.usage_count || 0} بار</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error ? 'خطا در بارگذاری قالب‌ها' : 'قالبی در این دسته‌بندی یافت نشد'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error 
                ? (error.message?.includes('Authentication') 
                   ? 'لطفاً ابتدا وارد حساب مدیریت شوید' 
                   : `خطا: ${error.message}`)
                : 'دسته‌بندی دیگری را انتخاب کنید یا روی بروزرسانی کلیک کنید'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {error?.message?.includes('Authentication') ? (
                <Button 
                  onClick={() => setLocation('/admin/login')} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ورود به حساب مدیریت
                </Button>
              ) : null}
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                تلاش مجدد
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTemplate && (
          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-right">
                  ویرایش قالب ایمیل
                </DialogTitle>
              </DialogHeader>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const data = {
                    id: editingTemplate.id,
                    name: formData.get('name') as string,
                    subject: formData.get('subject') as string,
                    html_content: formData.get('html_content') as string,
                    text_content: formData.get('text_content') as string,
                    category: formData.get('category') as string,
                    language: formData.get('language') as string,
                    is_active: formData.get('is_active') === 'on'
                  };
                  updateTemplateMutation.mutate(data);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">نام قالب</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingTemplate.name}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">دسته‌بندی</Label>
                    <Select name="category" defaultValue={editingTemplate.category}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => (
                          <SelectItem key={key} value={key}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="inventory_alerts">هشدار موجودی</SelectItem>
                        <SelectItem value="payment_notifications">اطلاعیه‌های پرداخت</SelectItem>
                        <SelectItem value="system_notifications">اطلاعیه‌های سیستم</SelectItem>
                        <SelectItem value="security_alerts">هشدارهای امنیتی</SelectItem>
                        <SelectItem value="password-reset">بازنشانی رمز عبور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="language">زبان</Label>
                    <Select name="language" defaultValue={editingTemplate.language || 'fa'}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">فارسی</SelectItem>
                        <SelectItem value="en">انگلیسی</SelectItem>
                        <SelectItem value="ar">عربی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingTemplate.is_active}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">
                      فعال
                    </Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">موضوع ایمیل</Label>
                  <Input
                    id="subject"
                    name="subject"
                    defaultValue={editingTemplate.subject}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="html_content">محتوای HTML</Label>
                  <Textarea
                    id="html_content"
                    name="html_content"
                    defaultValue={editingTemplate.html_content}
                    className="mt-1 min-h-[300px] font-mono text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="text_content">محتوای متنی (اختیاری)</Label>
                  <Textarea
                    id="text_content"
                    name="text_content"
                    defaultValue={editingTemplate.text_content || ''}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                    disabled={updateTemplateMutation.isPending}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTemplateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateTemplateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  پیش‌نمایش: {previewTemplate.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-6">
                <div 
                  className="border rounded-lg p-4 bg-gray-50"
                  dangerouslySetInnerHTML={{ 
                    __html: previewTemplate.html_content || 'محتوای HTML موجود نیست' 
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesCentral;