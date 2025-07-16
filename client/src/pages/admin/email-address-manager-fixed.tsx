import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Save, Edit, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface EmailCategoryAssignment {
  id?: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  assignedEmail: string;
  isActive: boolean;
  smtpConfigured?: boolean;
  lastTested?: string;
  testStatus?: string;
}

export default function EmailAddressManagerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ [key: string]: string }>({});

  // Query to get category assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email/category-assignments"],
  });

  // Query to get email categories with SMTP status
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/admin/email/categories"],
  });

  // Mutation to update email assignment
  const updateEmailMutation = useMutation({
    mutationFn: async (data: { categoryKey: string; newEmail: string }) => {
      const response = await fetch('/api/admin/email/update-category-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'خطا در به‌روزرسانی آدرس ایمیل');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "آدرس ایمیل با موفقیت به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/category-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      setEditingCategory(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا در به‌روزرسانی", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Default assignments
  const defaultAssignments: EmailCategoryAssignment[] = [
    {
      categoryKey: 'password-reset',
      categoryName: 'بازیابی رمز عبور',
      description: 'ایمیل‌های بازیابی و تغییر رمز عبور، هشدارهای امنیتی',
      assignedEmail: 'noreply@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'system-notifications',
      categoryName: 'اطلاعات سیستم',
      description: 'تعمیرات سیستم، هشدارهای تکنیکال، به‌روزرسانی‌ها',
      assignedEmail: 'system@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'user-management',
      categoryName: 'مدیریت کاربران',
      description: 'ایجاد حساب جدید، تغییر سطح دسترسی، غیرفعال‌سازی',
      assignedEmail: 'users@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'security-alerts',
      categoryName: 'هشدارهای امنیتی',
      description: 'ورود مشکوک، نقض امنیت، گزارش‌های امنیتی',
      assignedEmail: 'security@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'admin',
      categoryName: 'مدیریت عمومی',
      description: 'پیام‌های مدیریتی، گزارش‌های کلی، اطلاعات مهم',
      assignedEmail: 'info@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'inventory-alerts',
      categoryName: 'هشدارهای موجودی',
      description: 'کمبود موجودی، هشدار سطح انبار، نیاز به تأمین',
      assignedEmail: 'inventory@momtazchem.com',
      isActive: true
    },
    {
      categoryKey: 'crm-notifications',
      categoryName: 'اطلاعات CRM',
      description: 'فعالیت مشتری جدید، گزارش‌های CRM، یادآوری پیگیری',
      assignedEmail: 'crm@momtazchem.com',
      isActive: true
    }
  ];

  // Create category assignments with SMTP status
  const categoryAssignments = defaultAssignments.map(assignment => {
    // Find corresponding category with SMTP status (categories.data is the array)
    const categoriesArray = categories?.categories || [];
    const category = categoriesArray.find((cat: any) => cat.categoryKey === assignment.categoryKey);
    return {
      ...assignment,
      smtpConfigured: !!category?.smtp,
      testStatus: category?.smtp?.testStatus || 'untested',
      lastTested: category?.smtp?.lastTested
    };
  });

  const startEditing = (categoryKey: string, currentEmail: string) => {
    setEditingCategory(categoryKey);
    setEditForm({ [categoryKey]: currentEmail });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditForm({});
  };

  const saveEmail = (categoryKey: string) => {
    const newEmail = editForm[categoryKey];
    if (!newEmail || !newEmail.includes('@')) {
      toast({ title: "لطفاً آدرس ایمیل معتبری وارد کنید", variant: "destructive" });
      return;
    }
    
    updateEmailMutation.mutate({ categoryKey, newEmail });
  };

  const getStatusBadge = (assignment: EmailCategoryAssignment) => {
    if (!assignment.smtpConfigured) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" />تنظیم نشده</Badge>;
    }
    
    switch (assignment.testStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 gap-1"><CheckCircle className="w-3 h-3" />آماده</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />خرابی</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />تست نشده</Badge>;
    }
  };

  // Show loading state
  if (isLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/advanced-email-settings")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به تنظیمات ایمیل
        </Button>
        <div>
          <h1 className="text-3xl font-bold">مدیریت آدرس‌های ایمیل</h1>
          <p className="text-gray-600 mt-1">تنظیم آدرس‌های ایمیل برای هر نوع نوتیفیکیشن و کاربرد سیستم</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">نحوه عملکرد</span>
        </div>
        <p className="text-blue-700 text-sm">
          با تغییر آدرس‌های ایمیل در این بخش، تمام نوتیفیکیشن‌ها، تغییرات پسورد، هشدارهای سیستم و سایر پیام‌های خودکار 
          به آدرس‌های جدید ارسال خواهند شد. پس از تغییر، حتماً SMTP را برای آن دسته‌بندی تنظیم کنید.
        </p>
      </div>

      <div className="space-y-4">
        {categoryAssignments.map((assignment) => (
          <Card key={assignment.categoryKey} className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{assignment.categoryName}</h3>
                    {getStatusBadge(assignment)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{assignment.description}</p>
                  
                  {editingCategory === assignment.categoryKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`email-${assignment.categoryKey}`} className="text-sm font-medium">
                          آدرس ایمیل جدید
                        </Label>
                        <Input
                          id={`email-${assignment.categoryKey}`}
                          type="email"
                          value={editForm[assignment.categoryKey] || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, [assignment.categoryKey]: e.target.value }))}
                          placeholder="example@momtazchem.com"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEmail(assignment.categoryKey)}
                          disabled={updateEmailMutation.isPending}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          ذخیره
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={updateEmailMutation.isPending}
                        >
                          لغو
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="bg-gray-50 px-3 py-2 rounded border">
                        <span className="font-mono text-sm">{assignment.assignedEmail}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(assignment.categoryKey, assignment.assignedEmail)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        ویرایش
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-amber-900">نکته مهم</span>
        </div>
        <p className="text-amber-700 text-sm">
          پس از تغییر آدرس ایمیل هر دسته‌بندی، حتماً از بخش "تنظیمات پیشرفته ایمیل" SMTP مربوط به آن آدرس را 
          پیکربندی و تست کنید تا ایمیل‌ها به درستی ارسال شوند.
        </p>
      </div>
    </div>
  );
}