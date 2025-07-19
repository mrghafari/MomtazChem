import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Hash, Lock, UnlockKeyhole, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  templateNumber?: string;
  isNumberLocked?: boolean;
}

// شماره‌های از پیش تعریف شده برای قالب‌ها (غیر قابل تغییر)
const PREDEFINED_TEMPLATE_NUMBERS = {
  '#01 - Technical Support Response': 'T001',
  '#02 - Product Information Response': 'T002', 
  '#03 - General Inquiry Response': 'T003',
  '#04 - قالب پاسخ استعلام - طراحی زیبا و حرفه‌ای': 'T004',
  '#05 - Momtaz Chemical Follow-up Response': 'T005',
  '#06 - Password Management Template': 'T006',
  '#07 - Product Inquiry Admin Notification': 'T007',
  '#08 - Customer Inquiry Confirmation': 'T008',
  '#09 - Sales Inquiry Notification': 'T009',
  '#10 - Quote Request Notification': 'T010',
  '#11 - Generated Password Notification (Persian)': 'T011',
  '#12 - Admin Password Reset (Persian)': 'T012',
  '#13 - Low Stock Alert (Universal Service)': 'T013',
  '#14 - Payment Confirmation': 'T014',
  '#15 - System Notification': 'T015',
  '#16 - Security Alert': 'T016',
  '#17 - Comprehensive Inventory Alert System': 'T017'
};

export default function TemplateNumberingSystem() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [customNumber, setCustomNumber] = useState('');
  const [showLockDialog, setShowLockDialog] = useState(false);

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email/templates'],
    enabled: !!user
  });

  // Mutation برای به‌روزرسانی شماره قالب
  const updateTemplateMutation = useMutation({
    mutationFn: (data: { id: number; templateNumber: string; isNumberLocked: boolean }) =>
      apiRequest(`/api/admin/email/templates/${data.id}/number`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: "✅ شماره‌گذاری موفق",
        description: "شماره قالب با موفقیت تنظیم شد",
      });
      setEditingTemplate(null);
      setCustomNumber('');
    },
    onError: () => {
      toast({
        title: "❌ خطا در شماره‌گذاری", 
        description: "امکان تنظیم شماره قالب وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Mutation برای قفل کردن همه شماره‌ها
  const lockAllNumbersMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/email/templates/lock-all-numbers', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: "🔒 همه شماره‌ها قفل شدند",
        description: "تمام شماره‌های قالب‌ها غیر قابل تغییر شدند",
      });
      setShowLockDialog(false);
    }
  });

  // تعیین شماره از پیش تعریف شده برای قالب
  const getPredefinedNumber = (templateName: string) => {
    return PREDEFINED_TEMPLATE_NUMBERS[templateName as keyof typeof PREDEFINED_TEMPLATE_NUMBERS];
  };

  // اعمال شماره از پیش تعریف شده
  const applyPredefinedNumber = (template: EmailTemplate) => {
    const predefinedNumber = getPredefinedNumber(template.name);
    if (predefinedNumber) {
      updateTemplateMutation.mutate({
        id: template.id,
        templateNumber: predefinedNumber,
        isNumberLocked: true
      });
    }
  };

  // اعمال شماره شخصی‌سازی شده
  const applyCustomNumber = () => {
    if (editingTemplate && customNumber.trim()) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        templateNumber: customNumber.trim(),
        isNumberLocked: false
      });
    }
  };

  const getStatusColor = (template: EmailTemplate) => {
    if (template.templateNumber && template.isNumberLocked) return 'green';
    if (template.templateNumber && !template.isNumberLocked) return 'blue';
    return 'gray';
  };

  const getStatusText = (template: EmailTemplate) => {
    if (template.templateNumber && template.isNumberLocked) return 'قفل شده';
    if (template.templateNumber && !template.isNumberLocked) return 'قابل تغییر';
    return 'بدون شماره';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/admin/email-templates-central')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به مرکز قالب‌ها
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Hash className="w-8 h-8 text-blue-600" />
              سیستم شماره‌گذاری قالب‌ها
            </h1>
            <p className="text-gray-600 mt-1">
              تنظیم شماره‌های منحصر به فرد و غیر قابل تغییر برای هر قالب ایمیل
            </p>
          </div>
        </div>

        <Button 
          onClick={() => setShowLockDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={templates.every(t => t.isNumberLocked)}
        >
          <Lock className="w-4 h-4 mr-2" />
          قفل همه شماره‌ها
        </Button>
      </div>

      {/* Critical Warning */}
      <Alert className="mb-6 border-red-500 bg-red-50">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>⚠️ هشدار بحرانی:</strong> پس از قفل کردن شماره‌ها، امکان تغییر آن‌ها وجود نخواهد داشت. 
          این کار برای جلوگیری از ارسال ایمیل‌های اشتباه به مشتریان ضروری است.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">شماره‌های قفل شده</p>
                <p className="text-2xl font-bold text-green-900">
                  {templates.filter(t => t.isNumberLocked).length}
                </p>
              </div>
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">شماره‌های قابل تغییر</p>
                <p className="text-2xl font-bold text-blue-900">
                  {templates.filter(t => t.templateNumber && !t.isNumberLocked).length}
                </p>
              </div>
              <UnlockKeyhole className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-medium">بدون شماره</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.filter(t => !t.templateNumber).length}
                </p>
              </div>
              <Hash className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map(template => {
          const predefinedNumber = getPredefinedNumber(template.name);
          const statusColor = getStatusColor(template);
          
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg bg-${statusColor}-100 border-2 border-${statusColor}-300 flex items-center justify-center`}>
                      {template.templateNumber ? (
                        <span className={`text-${statusColor}-800 font-bold text-lg`}>
                          {template.templateNumber}
                        </span>
                      ) : (
                        <Hash className={`w-8 h-8 text-${statusColor}-600`} />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={statusColor === 'green' ? 'default' : statusColor === 'blue' ? 'secondary' : 'outline'}
                          className={`text-xs ${
                            statusColor === 'green' ? 'bg-green-600 text-white' :
                            statusColor === 'blue' ? 'bg-blue-600 text-white' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusText(template)}
                        </Badge>
                        {predefinedNumber && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-800">
                            پیشنهاد: {predefinedNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {predefinedNumber && !template.isNumberLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPredefinedNumber(template)}
                        className="text-purple-700 border-purple-300 hover:bg-purple-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        اعمال {predefinedNumber}
                      </Button>
                    )}
                    
                    {!template.isNumberLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setCustomNumber(template.templateNumber || '');
                        }}
                      >
                        <Hash className="w-4 h-4 mr-2" />
                        شماره شخصی
                      </Button>
                    )}

                    {template.isNumberLocked && (
                      <Badge className="bg-green-600 text-white">
                        <Lock className="w-3 h-3 mr-1" />
                        قفل شده
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Number Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تنظیم شماره شخصی برای قالب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateNumber">شماره قالب</Label>
              <Input
                id="templateNumber"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                placeholder="مثال: CUST001"
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-1">
                شماره‌ای منحصر به فرد برای این قالب انتخاب کنید
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              انصراف
            </Button>
            <Button 
              onClick={applyCustomNumber}
              disabled={!customNumber.trim() || updateTemplateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              ذخیره شماره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock All Confirmation Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-800">⚠️ تأیید قفل کردن همه شماره‌ها</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <AlertDescription className="text-red-800">
                این عمل غیر قابل بازگشت است! پس از قفل کردن، هیچ شماره‌ای قابل تغییر نخواهد بود.
              </AlertDescription>
            </Alert>
            
            <p className="text-gray-700">
              آیا از قفل کردن همه شماره‌های قالب‌ها اطمینان دارید؟ این کار برای جلوگیری از 
              ارسال ایمیل‌های اشتباه به مشتریان ضروری است.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              انصراف
            </Button>
            <Button 
              onClick={() => lockAllNumbersMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={lockAllNumbersMutation.isPending}
            >
              <Lock className="w-4 h-4 mr-2" />
              قفل همه شماره‌ها
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}