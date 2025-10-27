import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { 
  Cloud, 
  Save, 
  TestTube, 
  Upload, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

interface AwsS3Settings {
  id?: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  isActive: boolean;
  endpoint?: string;
  usePathStyle: boolean;
  publicUrl?: string;
  description?: string;
}

export default function AwsS3Settings() {
  const [settings, setSettings] = useState<AwsS3Settings>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucketName: '',
    isActive: true,
    usePathStyle: false,
    endpoint: '',
    publicUrl: '',
    description: ''
  });
  
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/aws-s3/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            ...data.settings,
            // Don't show actual keys in UI for security
            accessKeyId: data.settings.accessKeyId ? '••••••••' : '',
            secretAccessKey: data.settings.secretAccessKey ? '••••••••' : ''
          });
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات:', error);
    }
  };

  const handleSave = async () => {
    if (!settings.accessKeyId || !settings.secretAccessKey || !settings.region || !settings.bucketName) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload - exclude masked credentials
      const payload: any = {
        region: settings.region,
        bucketName: settings.bucketName,
        isActive: settings.isActive,
        endpoint: settings.endpoint,
        usePathStyle: settings.usePathStyle,
        publicUrl: settings.publicUrl,
        description: settings.description
      };

      // Only include keys if they are not masked (i.e., user changed them)
      if (settings.accessKeyId && settings.accessKeyId !== '••••••••') {
        payload.accessKeyId = settings.accessKeyId;
      }
      if (settings.secretAccessKey && settings.secretAccessKey !== '••••••••') {
        payload.secretAccessKey = settings.secretAccessKey;
      }

      const response = await fetch('/api/admin/aws-s3/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "✅ تنظیمات ذخیره شد",
          description: "تنظیمات AWS S3 با موفقیت ذخیره شد"
        });
        loadSettings();
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در ذخیره تنظیمات",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ارتباط با سرور",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/aws-s3/test', {
        method: 'POST'
      });

      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? 'اتصال موفق بود' : 'اتصال ناموفق بود')
      });
      
      if (response.ok) {
        toast({
          title: "✅ تست موفق",
          description: data.message
        });
      } else {
        toast({
          title: "❌ تست ناموفق",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'خطا در تست اتصال'
      });
      toast({
        title: "خطا",
        description: "خطا در تست اتصال",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'eu-west-2', label: 'EU (London)' },
    { value: 'eu-west-3', label: 'EU (Paris)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'me-south-1', label: 'Middle East (Bahrain)' }
  ];

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Cloud className="w-8 h-8 text-blue-600" />
          تنظیمات AWS S3
        </h1>
        <p className="text-gray-600 mt-2">
          پیکربندی سرویس ذخیره‌سازی ابری Amazon S3 برای آپلود و مدیریت فایل‌ها و تصاویر
        </p>
      </div>

      <div className="grid gap-6">
        {/* اطلاعات راهنما */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">نحوه دریافت اطلاعات AWS:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>برای Access Key و Secret Key: وارد کنسول AWS شوید → IAM → Users → Security Credentials → Create Access Key</li>
                <li>برای Region: مطابق با منطقه‌ای که bucket خود را ایجاد کرده‌اید (مثل us-east-1)</li>
                <li>برای Bucket Name: وارد S3 Console شوید و نام bucket خود را کپی کنید</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* فرم تنظیمات */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات اتصال AWS S3</CardTitle>
            <CardDescription>
              کلیدهای دسترسی و تنظیمات bucket را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Access Key ID */}
            <div className="space-y-2">
              <Label htmlFor="accessKeyId">
                Access Key ID <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="accessKeyId"
                  type={showAccessKey ? "text" : "password"}
                  value={settings.accessKeyId}
                  onChange={(e) => setSettings({ ...settings, accessKeyId: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="pr-10"
                  data-testid="input-access-key-id"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-access-key"
                >
                  {showAccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Secret Access Key */}
            <div className="space-y-2">
              <Label htmlFor="secretAccessKey">
                Secret Access Key <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="secretAccessKey"
                  type={showSecretKey ? "text" : "password"}
                  value={settings.secretAccessKey}
                  onChange={(e) => setSettings({ ...settings, secretAccessKey: e.target.value })}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="pr-10"
                  data-testid="input-secret-access-key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-secret-key"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region">
                منطقه (Region) <span className="text-red-500">*</span>
              </Label>
              <select
                id="region"
                value={settings.region}
                onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="select-region"
              >
                {awsRegions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bucket Name */}
            <div className="space-y-2">
              <Label htmlFor="bucketName">
                نام Bucket <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bucketName"
                value={settings.bucketName}
                onChange={(e) => setSettings({ ...settings, bucketName: e.target.value })}
                placeholder="my-app-bucket"
                data-testid="input-bucket-name"
              />
            </div>

            {/* تنظیمات اضافی */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">تنظیمات پیشرفته (اختیاری)</h3>
              
              {/* Custom Endpoint */}
              <div className="space-y-2">
                <Label htmlFor="endpoint">
                  Endpoint سفارشی
                </Label>
                <Input
                  id="endpoint"
                  value={settings.endpoint || ''}
                  onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                  placeholder="https://s3-compatible-service.com"
                  data-testid="input-endpoint"
                />
                <p className="text-sm text-gray-500">
                  برای سرویس‌های سازگار با S3 مانند MinIO یا DigitalOcean Spaces
                </p>
              </div>

              {/* Public URL */}
              <div className="space-y-2">
                <Label htmlFor="publicUrl">
                  URL عمومی
                </Label>
                <Input
                  id="publicUrl"
                  value={settings.publicUrl || ''}
                  onChange={(e) => setSettings({ ...settings, publicUrl: e.target.value })}
                  placeholder="https://cdn.example.com"
                  data-testid="input-public-url"
                />
                <p className="text-sm text-gray-500">
                  URL عمومی برای دسترسی به فایل‌ها (اگر از CDN استفاده می‌کنید)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  توضیحات
                </Label>
                <Textarea
                  id="description"
                  value={settings.description || ''}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder="توضیحات این پیکربندی..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              {/* Use Path Style */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="usePathStyle">
                    استفاده از Path Style URLs
                  </Label>
                  <p className="text-sm text-gray-500">
                    فعال کنید اگر سرویس شما به URL های path-style نیاز دارد
                  </p>
                </div>
                <Switch
                  id="usePathStyle"
                  checked={settings.usePathStyle}
                  onCheckedChange={(checked) => setSettings({ ...settings, usePathStyle: checked })}
                  data-testid="switch-use-path-style"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isActive">
                    فعال
                  </Label>
                  <p className="text-sm text-gray-500">
                    فعال یا غیرفعال کردن استفاده از AWS S3
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={settings.isActive}
                  onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                  data-testid="switch-is-active"
                />
              </div>
            </div>

            {/* دکمه‌های عملیاتی */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 ml-2" />
                {isLoading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </Button>
              
              <Button
                onClick={handleTest}
                disabled={isTesting}
                variant="outline"
                className="flex-1"
                data-testid="button-test-connection"
              >
                <TestTube className="w-4 h-4 ml-2" />
                {isTesting ? 'در حال تست...' : 'تست اتصال'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* نتیجه تست */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* راهنمای استفاده */}
        <Card>
          <CardHeader>
            <CardTitle>نحوه استفاده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                آپلود فایل‌ها
              </h4>
              <p className="text-sm text-gray-600">
                بعد از پیکربندی، فایل‌ها و تصاویر به صورت خودکار به AWS S3 آپلود می‌شوند.
                می‌توانید از این سرویس برای:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mr-4">
                <li>تصاویر محصولات</li>
                <li>فایل‌های PDF کاتالوگ</li>
                <li>اسناد آپلود شده توسط کاربران</li>
                <li>تصاویر پروفایل و لوگو</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                نکات امنیتی
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mr-4">
                <li>کلیدهای دسترسی به صورت رمزنگاری شده در دیتابیس ذخیره می‌شوند</li>
                <li>هرگز کلیدهای AWS خود را با دیگران به اشتراک نگذارید</li>
                <li>از IAM user با دسترسی محدود فقط به S3 استفاده کنید</li>
                <li>به طور منظم کلیدهای دسترسی خود را تغییر دهید</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
