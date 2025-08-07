import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Settings, TestTube, Save, Plus, Trash2, Edit, Check, X, AlertCircle, CheckCircle, Clock, Eye, EyeOff, XCircle, BookOpen, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import EmailSetupProgress from "@/components/ui/email-setup-progress";

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  smtp?: SmtpSetting | null;
  recipients: EmailRecipient[];
}

interface SmtpSetting {
  id: number;
  categoryId: number;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  testStatus: string;
  lastTested?: string;
  // Include database field names for compatibility
  category_id?: number;
  from_name?: string;
  from_email?: string;
  is_active?: boolean;
  test_status?: string;
  last_tested?: string;
}

interface EmailRecipient {
  id?: number;
  categoryId?: number;
  email: string;
  name?: string;
  isPrimary: boolean;
  isActive: boolean;
  recipientType?: 'to' | 'cc' | 'bcc';
  receiveTypes: string[];
}

interface SMTPForm {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export default function AdvancedEmailSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    categoryKey: "",
    categoryName: "",
    description: ""
  });
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | null>(null);
  const [smtpForm, setSmtpForm] = useState<SMTPForm>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "",
    fromEmail: ""
  });
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<EmailRecipient>({
    email: "",
    name: "",
    isPrimary: false,
    isActive: true,
    receiveTypes: [],
    recipientType: 'to'
  });
  const [assignmentForm, setAssignmentForm] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  // Global email settings state
  const [globalSettings, setGlobalSettings] = useState<{[key: string]: string}>({});
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [newCcAddress, setNewCcAddress] = useState('');
  


  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth");
        const data = await response.json();
        if (!data.success || !data.authenticated) {
          setLocation("/admin/login");
        }
      } catch (error) {
        setLocation("/admin/login");
      }
    };
    checkAuth();
  }, [setLocation]);

  // Initialize categories
  const initCategoriesMutation = useMutation({
    mutationFn: () => fetch("/api/admin/email/init-categories", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "Categories initialized successfully" });
    }
  });

  // Load categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["/api/admin/email/categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email/categories");
      const data = await response.json();
      console.log("Categories API Response:", data);
      return data;
    }
  });

  // Load category email assignments
  const { data: categoryAssignmentsData = [], refetch: refetchCategoryAssignments } = useQuery({
    queryKey: ["/api/admin/email/category-assignments"],
    queryFn: () => fetch("/api/admin/email/category-assignments").then(res => res.json())
  });

  // Load global email settings
  const { data: globalSettingsData } = useQuery({
    queryKey: ["/api/admin/email/global-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email/global-settings");
      return response.json();
    }
  });

  // Initialize global settings when data loads
  useEffect(() => {
    if (globalSettingsData?.success && globalSettingsData.settings) {
      setGlobalSettings(globalSettingsData.settings);
      
      // Parse CC addresses if they exist
      const ccAddressesString = globalSettingsData.settings.default_cc_addresses;
      if (ccAddressesString) {
        try {
          const parsed = JSON.parse(ccAddressesString);
          setCcAddresses(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCcAddresses([]);
        }
      }
    }
  }, [globalSettingsData]);

  // Update global email settings mutation
  const updateGlobalSettingMutation = useMutation({
    mutationFn: (data: { settingKey: string; settingValue: string; description?: string }) =>
      fetch("/api/admin/email/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/global-settings"] });
      toast({ title: "Global setting updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update global setting", variant: "destructive" });
    }
  });

  // Helper functions for CC address management
  const addCcAddress = () => {
    if (!newCcAddress.trim()) return;
    
    if (!newCcAddress.includes('@')) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    const updatedAddresses = [...ccAddresses, newCcAddress.trim()];
    setCcAddresses(updatedAddresses);
    setNewCcAddress('');
    
    // Update in database
    updateGlobalSettingMutation.mutate({
      settingKey: 'default_cc_addresses',
      settingValue: JSON.stringify(updatedAddresses),
      description: 'Default CC email addresses for all outgoing emails'
    });
  };

  const removeCcAddress = (index: number) => {
    const updatedAddresses = ccAddresses.filter((_, i) => i !== index);
    setCcAddresses(updatedAddresses);
    
    // Update in database
    updateGlobalSettingMutation.mutate({
      settingKey: 'default_cc_addresses',
      settingValue: JSON.stringify(updatedAddresses),
      description: 'Default CC email addresses for all outgoing emails'
    });
  };

  // Save SMTP settings
  const saveSmtpMutation = useMutation({
    mutationFn: (data: { categoryId: number; smtp: SMTPForm }) => 
      fetch(`/api/admin/email/smtp/${data.categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.smtp)
      }).then(res => res.json()),
    onSuccess: (data) => {
      console.log("SMTP save success:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "SMTP settings saved successfully" });
      // Force reload the categories to get updated SMTP data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/admin/email/categories"] });
      }, 100);
    },
    onError: () => {
      toast({ title: "Failed to save SMTP settings", variant: "destructive" });
    }
  });

  // Validate SMTP settings (before saving)
  const validateSmtp = async () => {
    if (!smtpForm.username || !smtpForm.password) {
      toast({ title: "Please enter email and password for validation", variant: "destructive" });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch('/api/admin/validate-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpForm.username,
          password: smtpForm.password,
          customHost: smtpForm.host || undefined,
          customPort: smtpForm.port || undefined,
        })
      });
      
      const result = await response.json();
      setValidationResult(result);
      
      if (result.isValid) {
        toast({ title: "SMTP validation successful! You can now save the settings." });
      } else {
        toast({ 
          title: "SMTP validation failed", 
          description: result.errors?.[0] || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
        configurationStatus: {
          hostReachable: false,
          portOpen: false,
          tlsSupported: false,
          authenticationWorking: false,
        },
      });
      toast({ title: "Validation failed", variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  // Test SMTP connection (using proper validation)
  const testSmtpConnection = async () => {
    if (!smtpForm.username || !smtpForm.password) {
      toast({ title: "Please enter email and password for testing", variant: "destructive" });
      return;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch('/api/admin/validate-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpForm.username,
          password: smtpForm.password,
          customHost: smtpForm.host || undefined,
          customPort: smtpForm.port || undefined,
          categoryId: selectedCategory?.id, // Include categoryId to update database
        })
      });
      
      const result = await response.json();
      
      if (result.isValid) {
        toast({ 
          title: "SMTP Connection Successful!", 
          description: "Your email settings are working correctly." 
        });
        // Refresh categories to show updated status
        queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      } else {
        toast({ 
          title: "SMTP Connection Failed", 
          description: result.errors?.[0] || "Connection test failed",
          variant: "destructive" 
        });
        // Refresh categories to show updated status
        queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      }
    } catch (error: any) {
      toast({ 
        title: "Connection Test Failed", 
        description: `Error: ${error.message}`,
        variant: "destructive" 
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Fetch category email assignments
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: ["/api/admin/email/category-assignments"],
    enabled: true
  });

  // Save category email assignment
  const saveCategoryAssignmentMutation = useMutation({
    mutationFn: async (data: { categoryKey: string; assignedEmail: string }) => {
      const response = await fetch("/api/admin/email/category-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Failed to save category assignment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تخصیص ایمیل با موفقیت ذخیره شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/category-assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ذخیره تخصیص ایمیل",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Save recipients
  const saveRecipientsMutation = useMutation({
    mutationFn: (data: { categoryId: number; recipients: EmailRecipient[] }) => 
      fetch(`/api/admin/email/recipients/${data.categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: data.recipients })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "Recipients updated successfully" });
    },
    onError: (error: any) => {
      console.error("Failed to save recipients:", error);
      toast({ title: "Failed to save recipients", variant: "destructive" });
    }
  });

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { categoryKey: string; categoryName: string; description: string }) => {
      const response = await fetch("/api/admin/email/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "دسته‌بندی با موفقیت ایجاد شد" });
      setShowAddCategory(false);
      setNewCategory({ categoryKey: "", categoryName: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد دسته‌بندی",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/admin/email/categories/${categoryId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "دسته‌بندی با موفقیت حذف شد" });
      if (selectedCategory) {
        setSelectedCategory(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطا در حذف دسته‌بندی",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const categories: EmailCategory[] = categoriesData?.categories || [];

  // Load selected category data
  useEffect(() => {
    console.log("Loading category data:", selectedCategory?.categoryName, selectedCategory?.smtp);
    
    if (selectedCategory?.smtp) {
      const smtp = selectedCategory.smtp;
      setSmtpForm({
        host: smtp.host || "",
        port: smtp.port || 587,
        secure: smtp.secure || false,
        username: smtp.username || "",
        password: smtp.password || "", // Show actual password
        fromName: smtp.fromName || smtp.from_name || "",
        fromEmail: smtp.fromEmail || smtp.from_email || ""
      });
    } else {
      setSmtpForm({
        host: "",
        port: 587,
        secure: false,
        username: "",
        password: "",
        fromName: "",
        fromEmail: ""
      });
    }
    
    // Always reload recipients from fresh data
    if (selectedCategory?.recipients && Array.isArray(selectedCategory.recipients)) {
      setRecipients([...selectedCategory.recipients]);
    } else {
      setRecipients([]);
    }
    
    // Reset new recipient form
    setNewRecipient({
      email: "",
      name: "",
      isPrimary: false,
      isActive: true,
      receiveTypes: []
    });
  }, [selectedCategory]);

  const handleSaveSmtp = () => {
    if (!selectedCategory) return;
    saveSmtpMutation.mutate({ categoryId: selectedCategory.id, smtp: smtpForm });
  };

  const handleTestSmtp = () => {
    testSmtpConnection();
  };

  const handleSaveRecipients = () => {
    if (!selectedCategory) return;
    saveRecipientsMutation.mutate({ categoryId: selectedCategory.id, recipients });
  };

  const addRecipient = () => {
    if (!newRecipient.email) return;
    setRecipients([...recipients, { ...newRecipient, id: Date.now() }]);
    setNewRecipient({
      email: "",
      name: "",
      isPrimary: false,
      isActive: true,
      receiveTypes: []
    });
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const getTestStatusIcon = (status: string) => {
    console.log("getTestStatusIcon called with status:", status);
    switch (status) {
      case "success":
        return <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg border-2 border-green-300" title="ایمیل به درستی کار می‌کند" />;
      case "failed":
        return <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg border-2 border-red-300" title="تنظیمات ایمیل اشتباه است" />;
      case "untested":
        return <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg border-2 border-orange-300" title="تست نشده" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm border-2 border-gray-300" title={`وضعیت نامشخص: ${status}`} />;
    }
  }

  // Function to get email status light based on SMTP configuration
  const getEmailStatusLight = (category: EmailCategory) => {
    console.log("Email Status Light Debug:", category.categoryName, category.smtp);
    
    if (!category.smtp) {
      console.log("No SMTP data for category:", category.categoryName);
      return <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm border-2 border-gray-300" title="SMTP تنظیم نشده" />;
    }
    
    // Check if all required SMTP fields are configured
    const smtp = category.smtp;
    const isFullyConfigured = smtp.host && 
                              smtp.username && 
                              smtp.password && 
                              (smtp.fromEmail || smtp.from_email);
    
    console.log("SMTP Configuration Check for", category.categoryName, {
      host: smtp.host,
      username: smtp.username,
      password: smtp.password ? "SET" : "NOT_SET",
      fromEmail: smtp.fromEmail || smtp.from_email,
      testStatus: smtp.testStatus || smtp.test_status,
      isFullyConfigured
    });
    
    if (!isFullyConfigured) {
      return <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg border-2 border-yellow-300 animate-pulse" title="تنظیمات SMTP ناکامل" />;
    }
    
    // Return status based on test result
    const status = smtp.testStatus || smtp.test_status || "untested";
    console.log("Final status for", category.categoryName, ":", status);
    return getTestStatusIcon(status);
  };

  const getCategoryColor = (categoryKey: string) => {
    const colors = {
      "admin": "bg-blue-100 text-blue-800",
      "fuel-additives": "bg-orange-100 text-orange-800",
      "water-treatment": "bg-cyan-100 text-cyan-800",
      "agricultural-fertilizers": "bg-green-100 text-green-800",
      "paint-thinner": "bg-purple-100 text-purple-800",
      "orders": "bg-yellow-100 text-yellow-800",
      "notifications": "bg-gray-100 text-gray-800",
      "password-reset": "bg-red-100 text-red-800",
      "account-verification": "bg-emerald-100 text-emerald-800",
      "order-confirmations": "bg-indigo-100 text-indigo-800",
      "payment-notifications": "bg-teal-100 text-teal-800",
      "inventory-alerts": "bg-amber-100 text-amber-800",
      "system-notifications": "bg-slate-100 text-slate-800",
      "backup-reports": "bg-lime-100 text-lime-800",
      "security-alerts": "bg-rose-100 text-rose-800",
      "user-management": "bg-violet-100 text-violet-800",
      "crm-notifications": "bg-pink-100 text-pink-800"
    };
    return colors[categoryKey as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading email settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        {user?.id === 1 && (
          <Button
            variant="outline"
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">Advanced Email Management</h1>
          <p className="text-gray-600 mt-1">Configure independent SMTP settings for each product category</p>
        </div>
      </div>

      {categories.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Initialize Email Categories</CardTitle>
            <CardDescription>
              Set up the default email categories for your chemical products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => initCategoriesMutation.mutate()}>
              Initialize Categories
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sub-modules section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">زیرماژول‌های تنظیمات ایمیل</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/admin/email-address-manager")}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">مدیریت آدرس‌های ایمیل</h3>
                  <p className="text-sm text-gray-600">Email Address Manager</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">تنظیم آدرس‌های ایمیل برای هر نوع نوتیفیکیشن و کاربرد سیستم</p>
            </div>
          </Card>



          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/admin/email-progress")}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Progress Tracker</h3>
                  <p className="text-sm text-gray-600">Email Configuration Progress</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">نمایش پیشرفت تنظیمات SMTP و وضعیت دسته‌بندی‌های ایمیل</p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/admin/email-templates-central")}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">📧 مرکز قالب‌های ایمیل</h3>
                  <p className="text-sm text-gray-600">Central Email Templates</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">مدیریت یکپارچه همه ۱۷ قالب ایمیل سیستم با دسته‌بندی کامل</p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/admin/automated-email-logs")}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">📋 گزارش ایمیل‌های خودکار</h3>
                  <p className="text-sm text-gray-600">Automated Email Logs</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">مشاهده تمامی ایمیل‌های ارسال شده توسط سیستم و محتوای آن‌ها</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Email Categories</h2>
          <p className="text-gray-600">Configure SMTP settings and recipients for each category</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddCategory(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            افزودن دسته‌بندی
          </Button>
          {selectedCategory && (
            <Button
              onClick={() => deleteCategoryMutation.mutate(selectedCategory.id)}
              variant="destructive"
              disabled={deleteCategoryMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteCategoryMutation.isPending ? "در حال حذف..." : "حذف دسته‌بندی"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-1">
          <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategory?.id === category.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {/* Status Light at Top */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getEmailStatusLight(category)}
                      <span className="text-xs text-gray-500">
                        {category.smtp?.testStatus === "success" ? "آماده" : 
                         category.smtp?.testStatus === "failed" ? "خرابی" : 
                         category.smtp ? "ناکامل" : "تنظیم نشده"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(category.categoryKey)}>
                      {category.categoryName}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {category.recipients?.length || 0} recipients
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {category.smtp ? "SMTP configured" : "No SMTP"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <Tabs defaultValue="smtp" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
                <TabsTrigger value="recipients">Email Recipients</TabsTrigger>
                <TabsTrigger value="category-assignment">Category Assignment</TabsTrigger>
                <TabsTrigger value="control">Email Control Panel</TabsTrigger>
              </TabsList>

              <TabsContent value="smtp">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      SMTP Configuration - {selectedCategory.categoryName}
                    </CardTitle>
                    <CardDescription>
                      Configure independent SMTP settings for this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input
                          id="host"
                          value={smtpForm.host}
                          onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={smtpForm.port}
                          onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="secure"
                        checked={smtpForm.secure}
                        onCheckedChange={(checked) => setSmtpForm({ ...smtpForm, secure: checked })}
                      />
                      <Label htmlFor="secure">Use SSL/TLS</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={smtpForm.username}
                          onChange={(e) => {
                            const username = e.target.value;
                            setSmtpForm({ 
                              ...smtpForm, 
                              username,
                              fromEmail: username || smtpForm.fromEmail
                            });
                          }}
                          placeholder="your-email@domain.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          For Zoho Mail: Use App Password (not regular password)
                        </p>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={smtpForm.password}
                            onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                            placeholder="Enter App Password for Zoho"
                            className="pr-10"
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          value={smtpForm.fromName}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                          placeholder="Momtaz Chemical"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          value={smtpForm.fromEmail}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                          placeholder="info@momtazchem.com"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Validation Section */}
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={validateSmtp}
                          disabled={isValidating || !smtpForm.username || !smtpForm.password}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                        >
                          {isValidating ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validate SMTP
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={handleSaveSmtp}
                          disabled={saveSmtpMutation.isPending || (validationResult && !validationResult.isValid)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save SMTP Settings
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleTestSmtp}
                          disabled={isValidating}
                        >
                          {isValidating ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-4 h-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Validation Results */}
                      {validationResult && (
                        <div className={`p-4 rounded-lg border ${
                          validationResult.isValid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {validationResult.isValid ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-800">SMTP Validation Successful</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="font-medium text-red-800">SMTP Validation Failed</span>
                              </>
                            )}
                          </div>
                          
                          {validationResult.errors && validationResult.errors.length > 0 && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-red-700 mb-1">Errors:</div>
                              <ul className="text-sm text-red-600 list-disc list-inside">
                                {validationResult.errors.map((error: string, idx: number) => (
                                  <li key={idx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-orange-700 mb-1">Suggestions:</div>
                              <ul className="text-sm text-orange-600 list-disc list-inside">
                                {validationResult.suggestions.map((suggestion: string, idx: number) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validationResult.configurationStatus && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                {validationResult.configurationStatus.hostReachable ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Host Reachable</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {validationResult.configurationStatus.authenticationWorking ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Authentication</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedCategory.smtp && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <strong>Current Status:</strong>
                          {getTestStatusIcon(selectedCategory.smtp.testStatus)}
                          <span className="capitalize">{selectedCategory.smtp.testStatus}</span>
                        </div>
                        {selectedCategory.smtp.lastTested && (
                          <p className="text-sm text-gray-600">
                            Last tested: {new Date(selectedCategory.smtp.lastTested).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipients">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Recipients - {selectedCategory.categoryName}</CardTitle>
                    <CardDescription>
                      Manage who receives emails for this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Add CC/BCC Section */}
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <h4 className="font-medium mb-3 text-blue-800">Quick Add CC/BCC Recipients</h4>
                      <p className="text-sm text-blue-600 mb-3">
                        Add independent email addresses for carbon copy (CC) or blind carbon copy (BCC) notifications
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="quickCCEmail">CC Email</Label>
                          <Input
                            id="quickCCEmail"
                            placeholder="cc@company.com"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                setRecipients([...recipients, {
                                  email: e.currentTarget.value,
                                  name: '',
                                  isPrimary: false,
                                  isActive: true,
                                  receiveTypes: [],
                                  recipientType: 'cc'
                                }]);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quickBCCEmail">BCC Email</Label>
                          <Input
                            id="quickBCCEmail"
                            placeholder="bcc@company.com"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                setRecipients([...recipients, {
                                  email: e.currentTarget.value,
                                  name: '',
                                  isPrimary: false,
                                  isActive: true,
                                  receiveTypes: [],
                                  recipientType: 'bcc'
                                }]);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const ccInput = document.getElementById('quickCCEmail') as HTMLInputElement;
                              const bccInput = document.getElementById('quickBCCEmail') as HTMLInputElement;
                              
                              if (ccInput.value) {
                                setRecipients([...recipients, {
                                  email: ccInput.value,
                                  name: '',
                                  isPrimary: false,
                                  isActive: true,
                                  receiveTypes: [],
                                  recipientType: 'cc'
                                }]);
                                ccInput.value = '';
                              }
                              
                              if (bccInput.value) {
                                setRecipients([...recipients, {
                                  email: bccInput.value,
                                  name: '',
                                  isPrimary: false,
                                  isActive: true,
                                  receiveTypes: [],
                                  recipientType: 'bcc'
                                }]);
                                bccInput.value = '';
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Both
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-blue-500 mt-2">
                        Press Enter in the field or click "Add Both" to quickly add recipients
                      </p>
                    </div>

                    {/* Add New Recipient */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Add New Recipient (Advanced)</h4>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label htmlFor="newEmail">Email</Label>
                          <Input
                            id="newEmail"
                            value={newRecipient.email}
                            onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                            placeholder="email@domain.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newName">Name (Optional)</Label>
                          <Input
                            id="newName"
                            value={newRecipient.name}
                            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                            placeholder="Recipient Name"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="newPrimary"
                            checked={newRecipient.isPrimary}
                            onCheckedChange={(checked) => setNewRecipient({ ...newRecipient, isPrimary: checked })}
                          />
                          <Label htmlFor="newPrimary">Primary recipient</Label>
                        </div>
                        <div>
                          <Label htmlFor="recipientType">Recipient Type</Label>
                          <Select
                            value={newRecipient.recipientType || 'to'}
                            onValueChange={(value) => setNewRecipient({ ...newRecipient, recipientType: value as 'to' | 'cc' | 'bcc' })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="to">To (Direct)</SelectItem>
                              <SelectItem value="cc">CC (Copy)</SelectItem>
                              <SelectItem value="bcc">BCC (Blind Copy)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={addRecipient} disabled={!newRecipient.email}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Recipient
                      </Button>
                    </div>

                    {/* Recipient Distribution Summary */}
                    {recipients.length > 0 && (
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <h4 className="font-medium mb-3 text-green-800">Current Email Distribution</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-green-700 mb-1">TO Recipients ({recipients.filter(r => !r.recipientType || r.recipientType === 'to').length})</h5>
                            <div className="space-y-1">
                              {recipients
                                .filter(r => !r.recipientType || r.recipientType === 'to')
                                .map((r, i) => (
                                  <div key={i} className="text-green-600">{r.email}</div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-700 mb-1">CC Recipients ({recipients.filter(r => r.recipientType === 'cc').length})</h5>
                            <div className="space-y-1">
                              {recipients
                                .filter(r => r.recipientType === 'cc')
                                .map((r, i) => (
                                  <div key={i} className="text-blue-600">{r.email}</div>
                                ))}
                              {recipients.filter(r => r.recipientType === 'cc').length === 0 && (
                                <div className="text-gray-500 italic">+ info@momtazchem.com (auto)</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-purple-700 mb-1">BCC Recipients ({recipients.filter(r => r.recipientType === 'bcc').length})</h5>
                            <div className="space-y-1">
                              {recipients
                                .filter(r => r.recipientType === 'bcc')
                                .map((r, i) => (
                                  <div key={i} className="text-purple-600">{r.email}</div>
                                ))}
                              {recipients.filter(r => r.recipientType === 'bcc').length === 0 && (
                                <div className="text-gray-500 italic">None</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Smart CC: info@momtazchem.com is automatically added as CC for monitoring unless already present as TO, CC, or BCC
                        </p>
                      </div>
                    )}

                    {/* Recipients List */}
                    <div className="space-y-3">
                      {recipients.map((recipient, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <strong>{recipient.email}</strong>
                                {recipient.isPrimary && (
                                  <Badge variant="default">Primary</Badge>
                                )}
                                <Badge variant={
                                  recipient.recipientType === 'cc' ? 'secondary' : 
                                  recipient.recipientType === 'bcc' ? 'outline' : 'default'
                                }>
                                  {recipient.recipientType === 'cc' ? 'CC' : 
                                   recipient.recipientType === 'bcc' ? 'BCC' : 'TO'}
                                </Badge>
                              </div>
                              {recipient.name && (
                                <p className="text-sm text-gray-600">{recipient.name}</p>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeRecipient(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleSaveRecipients}
                      disabled={saveRecipientsMutation.isPending}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Recipients
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="category-assignment">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Category Email Assignment
                    </CardTitle>
                    <CardDescription>
                      تخصیص ایمیل برای هر دسته‌بندی محصولات - درخواست‌های خرید بر اساس دسته‌بندی به ایمیل مربوطه ارسال می‌شود
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">توضیحات سیستم</span>
                      </div>
                      <p className="text-blue-700 text-sm">
                        هنگامی که مشتری درخواست خرید محصولی می‌دهد، بر اساس دسته‌بندی محصول، ایمیل به آدرس مخصوص همان دسته‌بندی ارسال خواهد شد.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Category Email Assignment Grid */}
                      <div className="grid gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            تخصیص ایمیل دسته‌بندی‌ها
                          </h4>
                          <div className="space-y-3">
                            {Array.isArray(categoryAssignments) && categoryAssignments.map((assignment: any) => (
                              <div key={assignment.categoryKey} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    {assignment.categoryName}
                                  </Label>
                                  <Badge variant="secondary" className="text-xs">
                                    {assignment.categoryKey}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">آدرس ایمیل تخصیص یافته</Label>
                                  <Input 
                                    value={assignmentForm[assignment.categoryKey] || assignment.assignedEmail || ''}
                                    onChange={(e) => setAssignmentForm({
                                      ...assignmentForm,
                                      [assignment.categoryKey]: e.target.value
                                    })}
                                    placeholder={`${assignment.categoryKey}@momtazchem.com`}
                                    className="text-sm"
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    if (assignmentForm[assignment.categoryKey]) {
                                      saveCategoryAssignmentMutation.mutate({
                                        categoryKey: assignment.categoryKey,
                                        assignedEmail: assignmentForm[assignment.categoryKey]
                                      });
                                    }
                                  }}
                                  disabled={!assignmentForm[assignment.categoryKey] || saveCategoryAssignmentMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                  Save
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Statistics and Info */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">وضعیت سیستم</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          تنظیمات تخصیص ایمیل فعال است. درخواست‌های خرید بر اساس دسته‌بندی محصول به آدرس ایمیل مربوطه ارسال می‌شود.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="control">
                <div className="space-y-6">
                  {/* CC Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Centralized Email Monitoring (CC Configuration)
                      </CardTitle>
                      <CardDescription>
                        Configure automatic CC for all outgoing emails to ensure centralized oversight
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Centralized CC Active</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          All emails (contact forms, product inquiries, password resets, quote requests) 
                          automatically CC <strong>info@momtazchem.com</strong> for comprehensive monitoring.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">CC Email Addresses</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            These emails receive a copy of every outgoing email
                          </p>
                          
                          {/* Display current CC addresses */}
                          <div className="space-y-2 mb-4">
                            {ccAddresses.length > 0 ? (
                              ccAddresses.map((address, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                  <code className="font-mono text-sm">{address}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCcAddress(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="bg-gray-50 p-3 rounded border text-center text-gray-500">
                                No CC addresses configured
                              </div>
                            )}
                          </div>
                          
                          {/* Add new CC address */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter email address"
                              value={newCcAddress}
                              onChange={(e) => setNewCcAddress(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addCcAddress()}
                            />
                            <Button 
                              onClick={addCcAddress}
                              disabled={!newCcAddress.trim() || updateGlobalSettingMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Email Types Covered</h4>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Contact Form Submissions
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Customer Confirmations
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Product Inquiries
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Password Reset Emails
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Quote Requests
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intelligent Routing Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Intelligent Email Routing Configuration
                      </CardTitle>
                      <CardDescription>
                        Manage automatic routing of contact forms to appropriate departments based on product categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Intelligent Routing Active</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          Contact forms are automatically routed to appropriate departments based on product interest selection.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Product Category → Department Mapping</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">fuel-additives</span>
                              <span className="font-medium">Fuel Additives Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">water-treatment</span>
                              <span className="font-medium">Water Treatment Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">paint-thinner</span>
                              <span className="font-medium">Paint & Thinner Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">agricultural-fertilizers</span>
                              <span className="font-medium">Agricultural Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">other</span>
                              <span className="font-medium">Support Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-gray-600">custom-solutions</span>
                              <span className="font-medium">Sales Dept</span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Smart Features</h4>
                          <ul className="text-sm space-y-2">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Automatic Detection:</strong> Reads product interest from contact forms
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Fallback System:</strong> Routes to admin when departments lack recipients
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Professional Confirmations:</strong> Department-specific confirmation emails
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Complete Logging:</strong> All routing decisions tracked for analytics
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email System Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Email System Status & Control
                      </CardTitle>
                      <CardDescription>
                        Monitor and control the overall email system functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-medium text-green-900">CC Monitoring</div>
                          <div className="text-sm text-green-700">Active</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-medium text-green-900">Smart Routing</div>
                          <div className="text-sm text-green-700">Active</div>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Settings className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="font-medium text-blue-900">Email Logging</div>
                          <div className="text-sm text-blue-700">Enabled</div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900 mb-1">Email System Administration</h4>
                            <p className="text-yellow-700 text-sm mb-3">
                              The email system is configured with centralized monitoring and intelligent routing. 
                              All changes to CC settings and routing logic require code-level modifications for security.
                            </p>
                            <div className="text-sm">
                              <strong>Current Configuration:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1 text-yellow-700">
                                <li>CC Email: info@momtazchem.com (hardcoded for security)</li>
                                <li>Routing Logic: Based on product category mapping</li>
                                <li>Fallback: Automatic admin routing when departments unavailable</li>
                                <li>Logging: All email activities tracked in database</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Common email system administration tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => window.open('/admin/email-routing-stats', '_blank')}
                          variant="outline" 
                          className="h-16 flex-col space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            View Email Routing Statistics
                          </div>
                          <div className="text-xs text-gray-500">Monitor routing performance</div>
                        </Button>
                        
                        <Button 
                          onClick={() => toast({ title: "SMTP Test", description: "SMTP testing functionality has been integrated into Email Settings." })}
                          variant="outline" 
                          className="h-16 flex-col space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <TestTube className="w-4 h-4" />
                            Test SMTP Configuration
                          </div>
                          <div className="text-xs text-gray-500">Validate email settings</div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
                  <p className="text-gray-600">Choose an email category from the left to configure its settings</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">افزودن دسته‌بندی جدید</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-key">کلید دسته‌بندی</Label>
                <Input
                  id="category-key"
                  value={newCategory.categoryKey}
                  onChange={(e) => setNewCategory({ ...newCategory, categoryKey: e.target.value })}
                  placeholder="مثال: marketing"
                />
              </div>
              
              <div>
                <Label htmlFor="category-name">نام دسته‌بندی</Label>
                <Input
                  id="category-name"
                  value={newCategory.categoryName}
                  onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                  placeholder="مثال: Marketing Department"
                />
              </div>
              
              <div>
                <Label htmlFor="category-description">توضیحات</Label>
                <Textarea
                  id="category-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="توضیح مختصری از دسته‌بندی..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ categoryKey: "", categoryName: "", description: "" });
                }}
              >
                انصراف
              </Button>
              <Button
                onClick={() => createCategoryMutation.mutate(newCategory)}
                disabled={!newCategory.categoryKey || !newCategory.categoryName || createCategoryMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}