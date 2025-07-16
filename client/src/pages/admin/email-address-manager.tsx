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

  // Create a merged view of assignments with SMTP status
  const categoryAssignments: EmailCategoryAssignment[] = [
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
  ].map(assignment => {
    // Find corresponding category with SMTP status (with null check)
    const category = categories?.find((cat: any) => cat.categoryKey === assignment.categoryKey);
    return {
      ...assignment,
      smtpConfigured: !!category?.smtp,
      testStatus: category?.smtp?.testStatus || 'untested',
      lastTested: category?.smtp?.lastTested
    };
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">در حال بارگذاری...</div>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{assignment.categoryName}</h3>
                    <p className="text-sm text-gray-600">{assignment.description}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {assignment.categoryKey}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(assignment)}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">آدرس ایمیل فعلی</Label>
                  {editingCategory === assignment.categoryKey ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="email"
                        value={editForm[assignment.categoryKey] || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          [assignment.categoryKey]: e.target.value
                        })}
                        placeholder="آدرس ایمیل جدید..."
                        className="flex-1"
                      />
                      <Button
                        onClick={() => saveEmail(assignment.categoryKey)}
                        disabled={updateEmailMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEditing}
                        size="sm"
                      >
                        انصراف
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-blue-600">{assignment.assignedEmail}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(assignment.categoryKey, assignment.assignedEmail)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        تغییر
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {assignment.lastTested && (
                <p className="text-xs text-gray-500 mt-2">
                  آخرین تست: {new Date(assignment.lastTested).toLocaleDateString('fa-IR')}
                </p>
              )}
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
          پس از تغییر هر آدرس ایمیل، حتماً به صفحه "Advanced Email Settings" بروید و SMTP را برای آن دسته‌بندی 
          تنظیم و تست کنید تا اطمینان حاصل شود که ایمیل‌ها درست ارسال می‌شوند.
        </p>
      </div>
    </div>
  );
}