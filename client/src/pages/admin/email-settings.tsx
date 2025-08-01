import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Mail, 
  Settings, 
  ArrowLeft, 
  Save, 
  TestTube2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  BookOpen,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailSettings {
  id?: number;
  category: string;
  name: string;
  description: string;
  emailAddress: string;
  isActive: boolean;
  isPrimary: boolean;
  usage: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

// No default email settings - use only database configurations

export default function EmailSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
  const [editingEmail, setEditingEmail] = useState<EmailSettings | null>(null);
  
  // SMTP settings state
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "",
    fromEmail: ""
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          setLocation('/admin/login');
        }
      } catch (error) {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  // Load existing settings
  const { data: currentSettings } = useQuery({
    queryKey: ["/api/admin/email-settings"],
    queryFn: () => fetch("/api/admin/email-settings").then(res => res.json())
  });

  // Effect to update state when data loads
  useEffect(() => {
    if (currentSettings?.emailSettings) {
      setEmailSettings(currentSettings.emailSettings);
    }
    if (currentSettings?.smtpSettings) {
      setSmtpSettings(currentSettings.smtpSettings);
    }
  }, [currentSettings]);

  // Save email settings mutation
  const saveEmailSettingsMutation = useMutation({
    mutationFn: (settings: EmailSettings[]) => 
      apiRequest("/api/admin/email-settings", "POST", { emailSettings: settings }),
    onSuccess: () => {
      toast({ title: "Success", description: "Email settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save email settings", variant: "destructive" });
    }
  });

  // Save SMTP settings mutation
  const saveSMTPSettingsMutation = useMutation({
    mutationFn: (settings: SMTPSettings) => 
      apiRequest("/api/admin/smtp-settings", "POST", settings),
    onSuccess: () => {
      toast({ title: "Success", description: "SMTP settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save SMTP settings", variant: "destructive" });
    }
  });

  // Test SMTP connection
  const testSMTPConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Map frontend fields to backend expected fields
      const testData = {
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        user: smtpSettings.user,
        pass: smtpSettings.pass,
        fromName: smtpSettings.fromName,
        fromEmail: smtpSettings.fromEmail
      };

      console.log('Testing SMTP with data:', { ...testData, pass: '***' });

      const response = await apiRequest("/api/admin/test-smtp", "POST", testData);
      if (response.success) {
        setConnectionStatus('success');
        toast({ title: "Success", description: "SMTP connection test successful" });
      } else {
        setConnectionStatus('error');
        toast({ title: "Error", description: response.message || "SMTP connection test failed", variant: "destructive" });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({ title: "Error", description: "SMTP connection test failed", variant: "destructive" });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveEmailSettings = () => {
    setIsSaving(true);
    saveEmailSettingsMutation.mutate(emailSettings);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleSaveSMTPSettings = () => {
    setIsSaving(true);
    saveSMTPSettingsMutation.mutate(smtpSettings);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const updateEmailSetting = (index: number, field: keyof EmailSettings, value: any) => {
    const updated = [...emailSettings];
    updated[index] = { ...updated[index], [field]: value };
    setEmailSettings(updated);
  };

  const toggleEmailActive = (index: number) => {
    updateEmailSetting(index, 'isActive', !emailSettings[index].isActive);
  };

  const getUsageColor = (usage: string) => {
    switch (usage.toLowerCase()) {
      case 'contact form':
        return 'bg-blue-100 text-blue-800';
      case 'product inquiries':
        return 'bg-green-100 text-green-800';
      case 'order confirmations':
        return 'bg-purple-100 text-purple-800';
      case 'technical support':
        return 'bg-orange-100 text-orange-800';
      case 'system notifications':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
            <p className="text-gray-600 mt-1">Configure email addresses and SMTP settings</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setLocation("/admin/email-progress")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            🎯 Progress Tracker
          </Button>
          <Button onClick={() => setLocation("/admin")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>

      <Tabs defaultValue="email-addresses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email-addresses">Email Addresses</TabsTrigger>
          <TabsTrigger value="smtp-settings">SMTP Settings</TabsTrigger>
          <TabsTrigger value="email-templates">قالب‌های ایمیل</TabsTrigger>
        </TabsList>

        {/* Email Addresses Tab */}
        <TabsContent value="email-addresses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Address Configuration</CardTitle>
              <CardDescription>
                Configure email addresses used throughout the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {emailSettings.map((setting, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{setting.name}</h3>
                      {setting.isPrimary && (
                        <Badge variant="default" className="bg-blue-600">Primary</Badge>
                      )}
                      <Switch
                        checked={setting.isActive}
                        onCheckedChange={() => toggleEmailActive(index)}
                      />
                      {setting.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">{setting.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`email-${index}`}>Email Address</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={setting.emailAddress}
                        onChange={(e) => updateEmailSetting(index, 'emailAddress', e.target.value)}
                        placeholder="email@domain.com"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={setting.category}
                        onChange={(e) => updateEmailSetting(index, 'category', e.target.value)}
                        placeholder="Category"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Used For:</Label>
                    <div className="flex flex-wrap gap-2">
                      {setting.usage.map((use, useIndex) => (
                        <Badge key={useIndex} variant="outline" className={getUsageColor(use)}>
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveEmailSettings}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Email Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings Tab */}
        <TabsContent value="smtp-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure SMTP server settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.zoho.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-user">Username</Label>
                  <Input
                    id="smtp-user"
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="info@momtazchem.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-pass">Password / App Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp-pass"
                      type={showPassword ? "text" : "password"}
                      value={smtpSettings.pass}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, pass: e.target.value }))}
                      placeholder="Enter password or app password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Momtaz Chemical"
                  />
                </div>
                <div>
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="info@momtazchem.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={testSMTPConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="flex-1"
                >
                  <TestTube2 className="w-4 h-4 mr-2" />
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button
                  onClick={handleSaveSMTPSettings}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save SMTP Settings'}
                </Button>
              </div>

              {connectionStatus !== 'idle' && (
                <Alert className={connectionStatus === 'success' ? 'border-green-200' : 'border-red-200'}>
                  {connectionStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {connectionStatus === 'success' 
                      ? 'SMTP connection test successful!' 
                      : 'SMTP connection test failed. Please check your settings.'}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Use App Passwords for Gmail, Zoho, and other providers that require 2FA.
                  Regular passwords will not work with modern email providers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email-templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                مدیریت قالب‌های ایمیل
              </CardTitle>
              <CardDescription>
                ایجاد، ویرایش و مدیریت قالب‌های ایمیل برای پاسخ‌های خودکار
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center items-center py-8">
                <Button
                  onClick={() => setLocation("/admin/email-templates")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  باز کردن مدیریت قالب‌ها
                </Button>
                
                <Button
                  onClick={() => setLocation("/admin/email-logs")}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 text-lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  لاگ ایمیل‌های اتوماتیک
                </Button>
              </div>
              <div className="text-center text-gray-600 mt-4">
                <p>در این بخش می‌توانید:</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>• قالب‌های جدید ایجاد کنید</p>
                  <p>• قالب‌های موجود را ویرایش کنید</p>
                  <p>• متغیرهای پویا اضافه کنید</p>
                  <p>• قالب پیش‌فرض تنظیم کنید</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}