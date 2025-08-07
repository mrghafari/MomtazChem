import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Plus, 
  Trash2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube,
  MessageCircle,
  Phone,
  ExternalLink,
  Settings,
  Globe,
  Mail,
  MapPin,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FooterSetting {
  id: number;
  language: string;
  companyName: string;
  companyDescription?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyCodal?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  wechatUrl?: string;
  wechatQr?: string;
  productLinks?: string;
  companyLinks?: string;
  supportLinks?: string;
  legalLinks?: string;
  copyrightText?: string;
  additionalInfo?: string;
  showSocialMedia: boolean;
  showCompanyInfo: boolean;
  showLinks: boolean;
}

interface LinkItem {
  name: string;
  href: string;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇮🇶' },
  { code: 'ku', name: 'کوردی', flag: '🏳️' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
];

const socialMediaPlatforms = [
  { key: 'facebookUrl', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { key: 'twitterUrl', name: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
  { key: 'linkedinUrl', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { key: 'instagramUrl', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { key: 'youtubeUrl', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { key: 'telegramUrl', name: 'Telegram', icon: MessageCircle, color: 'text-blue-400' },
  { key: 'whatsappUrl', name: 'WhatsApp', icon: Phone, color: 'text-green-600' },
  { key: 'wechatUrl', name: 'WeChat', icon: MessageCircle, color: 'text-green-500' }
];

export default function FooterManagement() {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [footerData, setFooterData] = useState<FooterSetting | null>(null);

  // Fetch footer settings
  const { data: footerSettings, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/footer-settings', selectedLanguage],
    queryFn: () => apiRequest(`/api/admin/footer-settings?language=${selectedLanguage}`),
  });

  // Update footer settings mutation
  const updateFooterMutation = useMutation({
    mutationFn: (data: Partial<FooterSetting>) => 
      apiRequest(`/api/admin/footer-settings/${footerData?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات فوتر بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/footer-settings'] });
    },
    onError: (error) => {
      toast({
        title: "❌ خطا در بروزرسانی",
        description: error.message || "مشکلی در ذخیره تنظیمات رخ داد",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (footerSettings?.data) {
      setFooterData(footerSettings.data);
    }
  }, [footerSettings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (!footerData) return;
    setFooterData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleLinksChange = (type: 'productLinks' | 'companyLinks' | 'supportLinks' | 'legalLinks', links: LinkItem[]) => {
    if (!footerData) return;
    setFooterData(prev => prev ? { ...prev, [type]: JSON.stringify(links) } : null);
  };

  const parseLinks = (linksJson?: string): LinkItem[] => {
    if (!linksJson) return [];
    try {
      return JSON.parse(linksJson);
    } catch {
      return [];
    }
  };

  const handleSave = () => {
    if (!footerData) return;
    updateFooterMutation.mutate(footerData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت فوتر وب‌سایت</h1>
          <p className="text-gray-600 mt-2">تنظیمات کامل فوتر برای زبان‌های مختلف</p>
        </div>
        <Button onClick={handleSave} disabled={updateFooterMutation.isPending} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {updateFooterMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </div>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            انتخاب زبان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? "default" : "outline"}
                onClick={() => setSelectedLanguage(lang.code)}
                className="flex items-center gap-2"
              >
                <span>{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {footerData && (
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              اطلاعات شرکت
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              شبکه‌های اجتماعی
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              لینک‌ها
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              تنظیمات نمایش
            </TabsTrigger>
          </TabsList>

          {/* Company Information Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات شرکت</CardTitle>
                <CardDescription>اطلاعات اصلی شرکت که در فوتر نمایش داده می‌شود</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">نام شرکت</Label>
                    <Input
                      id="companyName"
                      value={footerData.companyName || ''}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="نام شرکت"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyCodal">کد پُست‌ال</Label>
                    <Input
                      id="companyCodal"
                      value={footerData.companyCodal || ''}
                      onChange={(e) => handleInputChange('companyCodal', e.target.value)}
                      placeholder="کد پُست‌ال شرکت"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companyDescription">توضیحات شرکت</Label>
                  <Textarea
                    id="companyDescription"
                    value={footerData.companyDescription || ''}
                    onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                    placeholder="توضیح کوتاه درباره شرکت"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">آدرس شرکت</Label>
                  <Textarea
                    id="companyAddress"
                    value={footerData.companyAddress || ''}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    placeholder="آدرس کامل شرکت"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone">شماره تلفن</Label>
                    <Input
                      id="companyPhone"
                      value={footerData.companyPhone || ''}
                      onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                      placeholder="+964 750 353 3769"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">ایمیل شرکت</Label>
                    <Input
                      id="companyEmail"
                      value={footerData.companyEmail || ''}
                      onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                      placeholder="info@momtazchem.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="copyrightText">متن کپی‌رایت</Label>
                  <Input
                    id="copyrightText"
                    value={footerData.copyrightText || ''}
                    onChange={(e) => handleInputChange('copyrightText', e.target.value)}
                    placeholder="© 2025 Momtazchem. All rights reserved."
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo">اطلاعات اضافی</Label>
                  <Textarea
                    id="additionalInfo"
                    value={footerData.additionalInfo || ''}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="هر اطلاعات اضافی که می‌خواهید در فوتر نمایش دهید"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  شبکه‌های اجتماعی
                </CardTitle>
                <CardDescription>لینک‌های شبکه‌های اجتماعی شرکت</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {socialMediaPlatforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <div key={platform.key} className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${platform.color}`} />
                          {platform.name}
                        </Label>
                        <Input
                          value={(footerData as any)[platform.key] || ''}
                          onChange={(e) => handleInputChange(platform.key, e.target.value)}
                          placeholder={`لینک ${platform.name}`}
                          dir="ltr"
                        />
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div>
                  <Label htmlFor="wechatQr">کیو آر کد WeChat</Label>
                  <Input
                    id="wechatQr"
                    value={footerData.wechatQr || ''}
                    onChange={(e) => handleInputChange('wechatQr', e.target.value)}
                    placeholder="لینک تصویر QR کد WeChat"
                    dir="ltr"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    لینک تصویر QR کد WeChat برای نمایش در فوتر
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-6">
            <LinkSection
              title="لینک‌های محصولات"
              description="لینک‌هایی به دسته‌بندی‌های محصولات"
              links={parseLinks(footerData.productLinks)}
              onChange={(links) => handleLinksChange('productLinks', links)}
            />
            
            <LinkSection
              title="لینک‌های شرکت"
              description="لینک‌هایی به صفحات مختلف شرکت"
              links={parseLinks(footerData.companyLinks)}
              onChange={(links) => handleLinksChange('companyLinks', links)}
            />
            
            <LinkSection
              title="لینک‌های پشتیبانی"
              description="لینک‌هایی به بخش‌های پشتیبانی و راهنما"
              links={parseLinks(footerData.supportLinks)}
              onChange={(links) => handleLinksChange('supportLinks', links)}
            />
            
            <LinkSection
              title="لینک‌های قانونی"
              description="لینک‌هایی به صفحات قوانین و مقررات"
              links={parseLinks(footerData.legalLinks)}
              onChange={(links) => handleLinksChange('legalLinks', links)}
            />
          </TabsContent>

          {/* Display Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات نمایش</CardTitle>
                <CardDescription>کنترل نمایش بخش‌های مختلف فوتر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">نمایش شبکه‌های اجتماعی</Label>
                    <p className="text-sm text-gray-500">آیکن‌های شبکه‌های اجتماعی در فوتر نمایش داده شود</p>
                  </div>
                  <Switch
                    checked={footerData.showSocialMedia}
                    onCheckedChange={(checked) => handleInputChange('showSocialMedia', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">نمایش اطلاعات شرکت</Label>
                    <p className="text-sm text-gray-500">اطلاعات شرکت شامل آدرس و تماس در فوتر نمایش داده شود</p>
                  </div>
                  <Switch
                    checked={footerData.showCompanyInfo}
                    onCheckedChange={(checked) => handleInputChange('showCompanyInfo', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">نمایش لینک‌ها</Label>
                    <p className="text-sm text-gray-500">لینک‌های مختلف در بخش‌های جداگانه فوتر نمایش داده شود</p>
                  </div>
                  <Switch
                    checked={footerData.showLinks}
                    onCheckedChange={(checked) => handleInputChange('showLinks', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface LinkSectionProps {
  title: string;
  description: string;
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
}

function LinkSection({ title, description, links, onChange }: LinkSectionProps) {
  const addLink = () => {
    onChange([...links, { name: '', href: '' }]);
  };

  const updateLink = (index: number, field: 'name' | 'href', value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    onChange(updatedLinks);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.map((link, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>نام لینک</Label>
              <Input
                value={link.name}
                onChange={(e) => updateLink(index, 'name', e.target.value)}
                placeholder="نام لینک"
              />
            </div>
            <div className="flex-1">
              <Label>آدرس لینک</Label>
              <Input
                value={link.href}
                onChange={(e) => updateLink(index, 'href', e.target.value)}
                placeholder="/path/to/page"
                dir="ltr"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeLink(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addLink}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          افزودن لینک جدید
        </Button>
      </CardContent>
    </Card>
  );
}