import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Upload, 
  Download,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Send,
  Inbox,
  Building,
  FileCheck,
  Globe,
  Hash
} from 'lucide-react';

interface CompanyInfo {
  id?: number;
  companyName: string;
  companyNameEnglish: string;
  companyNameArabic: string;
  companyNameKurdish: string;
  logoUrl: string;
  website: string;
  email: string;
  supportEmail: string;
  salesEmail: string;
  phone: string;
  supportPhone: string;
  salesPhone: string;
  fax: string;
  address: string;
  addressEnglish: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId: string;
  registrationNumber: string;
  establishedYear: number;
  description: string;
  descriptionEnglish: string;
  mission: string;
  vision: string;
}

interface Correspondence {
  id?: number;
  referenceNumber: string;
  subject: string;
  senderName?: string;
  recipientName?: string;
  senderOrganization?: string;
  recipientOrganization?: string;
  senderEmail?: string;
  recipientEmail?: string;
  dateReceived?: string;
  dateSent?: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  category: string;
  content: string;
  attachmentUrl?: string;
  notes: string;
  tags: string;
}

interface CompanyDocument {
  id?: number;
  documentName: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  fileUrl: string;
  status: 'active' | 'expired' | 'renewed' | 'cancelled';
  description: string;
  tags: string;
}

interface BusinessCard {
  id?: number;
  employeeName: string;
  employeeNameArabic?: string;
  employeeNameKurdish?: string;
  jobTitle: string;
  jobTitleArabic?: string;
  jobTitleKurdish?: string;
  department?: string;
  directPhone?: string;
  mobilePhone?: string;
  email?: string;
  officeLocation?: string;
  linkedinProfile?: string;
  whatsappNumber?: string;
  cardDesign: 'standard' | 'executive' | 'creative';
  cardColor: string;
  includeQrCode: boolean;
  qrCodeData?: string;
  specialNotes?: string;
  isActive: boolean;
  printQuantity: number;
  lastPrintDate?: string;
  cardStatus: 'draft' | 'approved' | 'printed' | 'distributed';
  approvedBy?: number;
  approvedAt?: string;
  createdBy?: number;
}

export default function CompanyInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isAddingIncoming, setIsAddingIncoming] = useState(false);
  const [isAddingOutgoing, setIsAddingOutgoing] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isAddingBusinessCard, setIsAddingBusinessCard] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch company information
  const { data: companyInfo, isLoading: infoLoading } = useQuery<CompanyInfo>({
    queryKey: ['/api/company-info'],
    queryFn: async () => {
      const response = await fetch('/api/company-info', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch company info');
      const result = await response.json();
      return result.data || {};
    }
  });

  // Fetch incoming correspondence
  const { data: incomingMails } = useQuery<Correspondence[]>({
    queryKey: ['/api/correspondence/incoming'],
    queryFn: async () => {
      const response = await fetch('/api/correspondence/incoming', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch incoming correspondence');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch outgoing correspondence
  const { data: outgoingMails } = useQuery<Correspondence[]>({
    queryKey: ['/api/correspondence/outgoing'],
    queryFn: async () => {
      const response = await fetch('/api/correspondence/outgoing', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch outgoing correspondence');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch company documents
  const { data: companyDocs } = useQuery<CompanyDocument[]>({
    queryKey: ['/api/company-documents'],
    queryFn: async () => {
      const response = await fetch('/api/company-documents', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch company documents');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch business cards
  const { data: businessCards } = useQuery<BusinessCard[]>({
    queryKey: ['/api/business-cards'],
    queryFn: async () => {
      const response = await fetch('/api/business-cards', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch business cards');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Update company info mutation
  const updateCompanyInfoMutation = useMutation({
    mutationFn: async (data: CompanyInfo) => {
      const response = await fetch('/api/company-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "اطلاعات شرکت با موفقیت به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/company-info'] });
    }
  });

  // Business Cards mutations
  const addBusinessCardMutation = useMutation({
    mutationFn: async (data: BusinessCard) => {
      const response = await apiRequest('/api/business-cards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "کارت‌ویزیت جدید با موفقیت اضافه شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/business-cards'] });
      setIsAddingBusinessCard(false);
    },
    onError: (error) => {
      console.error('Error adding business card:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در اضافه کردن کارت‌ویزیت", 
        variant: "destructive" 
      });
    }
  });

  const updateBusinessCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BusinessCard }) => {
      const response = await apiRequest(`/api/business-cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "کارت‌ویزیت با موفقیت به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/business-cards'] });
      setEditingItem(null);
    },
    onError: (error) => {
      console.error('Error updating business card:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در به‌روزرسانی کارت‌ویزیت", 
        variant: "destructive" 
      });
    }
  });

  const deleteBusinessCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/business-cards/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "کارت‌ویزیت حذف شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/business-cards'] });
    },
    onError: (error) => {
      console.error('Error deleting business card:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در حذف کارت‌ویزیت", 
        variant: "destructive" 
      });
    }
  });

  const approveBusinessCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/business-cards/${id}/approve`, {
        method: 'PUT',
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "کارت‌ویزیت تایید شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/business-cards'] });
    },
    onError: (error) => {
      console.error('Error approving business card:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در تایید کارت‌ویزیت", 
        variant: "destructive" 
      });
    }
  });

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      low: 'bg-green-100 text-green-800'
    };
    const labels = { high: 'فوری', medium: 'متوسط', low: 'کم' };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'در انتظار', color: 'bg-orange-100 text-orange-800', icon: Clock },
      in_progress: { label: 'در حال بررسی', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      completed: { label: 'تکمیل شده', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { label: 'بایگانی شده', color: 'bg-gray-100 text-gray-800', icon: Archive },
      draft: { label: 'پیش‌نویس', color: 'bg-gray-100 text-gray-800', icon: Edit },
      sent: { label: 'ارسال شده', color: 'bg-blue-100 text-blue-800', icon: Send },
      active: { label: 'فعال', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { label: 'منقضی شده', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle
    };
    
    const Icon = statusInfo.icon;
    
    return (
      <Badge className={statusInfo.color}>
        <Icon className="w-3 h-3 ml-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  if (infoLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          اطلاعات شرکت
        </h1>
        <p className="text-gray-600 mt-2">
          مدیریت کامل اطلاعات، نامه‌های وارده و صادره، و مدارک شرکت
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            اطلاعات کلی
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            نامه‌های وارده ({incomingMails?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            نامه‌های صادره ({outgoingMails?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            مدارک شرکت ({companyDocs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="business-cards" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            کارت‌ویزیت‌ها
          </TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  اطلاعات پایه
                </CardTitle>
                <CardDescription>نام شرکت، لوگو و اطلاعات عمومی</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نام شرکت (فارسی)</Label>
                  <Input 
                    value={companyInfo?.companyName || ''} 
                    placeholder="شرکت ممتاز شیمی"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name (English)</Label>
                  <Input 
                    value={companyInfo?.companyNameEnglish || ''} 
                    placeholder="Momtaz Chemical Solutions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>لوگوی شرکت</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={companyInfo?.logoUrl || ''} 
                      placeholder="آدرس URL لوگو"
                    />
                    <Button size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>سایت وب</Label>
                  <Input 
                    value={companyInfo?.website || ''} 
                    placeholder="https://momtazchem.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سال تأسیس</Label>
                  <Input 
                    type="number"
                    value={companyInfo?.establishedYear || ''} 
                    placeholder="1400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  اطلاعات تماس
                </CardTitle>
                <CardDescription>تلفن‌ها، ایمیل‌ها و آدرس‌ها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ایمیل اصلی</Label>
                  <Input 
                    value={companyInfo?.email || ''} 
                    placeholder="info@momtazchem.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ایمیل پشتیبانی</Label>
                  <Input 
                    value={companyInfo?.supportEmail || ''} 
                    placeholder="support@momtazchem.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ایمیل فروش</Label>
                  <Input 
                    value={companyInfo?.salesEmail || ''} 
                    placeholder="sales@momtazchem.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تلفن اصلی</Label>
                  <Input 
                    value={companyInfo?.phone || ''} 
                    placeholder="+964 750 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تلفن پشتیبانی</Label>
                  <Input 
                    value={companyInfo?.supportPhone || ''} 
                    placeholder="+964 750 123 4568"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Legal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  اطلاعات حقوقی
                </CardTitle>
                <CardDescription>شماره ثبت، کد ملی و مدارک قانونی</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>شماره ثبت شرکت</Label>
                  <Input 
                    value={companyInfo?.registrationNumber || ''} 
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>شناسه مالیاتی</Label>
                  <Input 
                    value={companyInfo?.taxId || ''} 
                    placeholder="987654321"
                  />
                </div>
                <div className="space-y-2">
                  <Label>کد پستی</Label>
                  <Input 
                    value={companyInfo?.postalCode || ''} 
                    placeholder="12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>کشور</Label>
                  <Input 
                    value={companyInfo?.country || ''} 
                    placeholder="عراق"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  توضیحات شرکت
                </CardTitle>
                <CardDescription>درباره شرکت، مأموریت و چشم‌انداز</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>درباره شرکت</Label>
                  <Textarea 
                    value={companyInfo?.description || ''} 
                    placeholder="توضیح کاملی از شرکت و فعالیت‌های آن..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>مأموریت (Mission)</Label>
                  <Textarea 
                    value={companyInfo?.mission || ''} 
                    placeholder="مأموریت اصلی شرکت..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>چشم‌انداز (Vision)</Label>
                  <Textarea 
                    value={companyInfo?.vision || ''} 
                    placeholder="چشم‌انداز آینده شرکت..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button 
              size="lg"
              onClick={() => updateCompanyInfoMutation.mutate(companyInfo || {} as CompanyInfo)}
              disabled={updateCompanyInfoMutation.isPending}
            >
              {updateCompanyInfoMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </TabsContent>

        {/* Incoming Correspondence Tab */}
        <TabsContent value="incoming" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">نامه‌های وارده</h2>
            <Button onClick={() => setIsAddingIncoming(true)}>
              <Plus className="h-4 w-4 ml-1" />
              نامه جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {incomingMails?.map((mail) => (
              <Card key={mail.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-mono text-gray-600">{mail.referenceNumber}</span>
                        {getPriorityBadge(mail.priority)}
                        {getStatusBadge(mail.status)}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{mail.subject}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{mail.senderName} ({mail.senderOrganization})</span>
                        </div>
                        {mail.senderEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{mail.senderEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(mail.dateReceived!).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {mail.content && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{mail.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Outgoing Correspondence Tab */}
        <TabsContent value="outgoing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">نامه‌های صادره</h2>
            <Button onClick={() => setIsAddingOutgoing(true)}>
              <Plus className="h-4 w-4 ml-1" />
              نامه جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {outgoingMails?.map((mail) => (
              <Card key={mail.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-mono text-gray-600">{mail.referenceNumber}</span>
                        {getPriorityBadge(mail.priority)}
                        {getStatusBadge(mail.status)}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{mail.subject}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{mail.recipientName} ({mail.recipientOrganization})</span>
                        </div>
                        {mail.recipientEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{mail.recipientEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(mail.dateSent!).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {mail.content && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{mail.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Company Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">مدارک شرکت</h2>
            <Button onClick={() => setIsAddingDocument(true)}>
              <Plus className="h-4 w-4 ml-1" />
              مدرک جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {companyDocs?.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{doc.documentName}</span>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>نوع: {doc.documentType}</div>
                        {doc.documentNumber && <div>شماره: {doc.documentNumber}</div>}
                        {doc.issuingAuthority && <div>صادرکننده: {doc.issuingAuthority}</div>}
                        <div className="flex gap-4">
                          <span>صدور: {new Date(doc.issueDate).toLocaleDateString('fa-IR')}</span>
                          {doc.expiryDate && (
                            <span>انقضا: {new Date(doc.expiryDate).toLocaleDateString('fa-IR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{doc.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Business Cards Tab */}
        <TabsContent value="business-cards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">کارت‌ویزیت‌های شرکت</h2>
            <Button onClick={() => setIsAddingBusinessCard(true)}>
              <Plus className="h-4 w-4 ml-1" />
              کارت‌ویزیت جدید
            </Button>
          </div>

          <div className="grid gap-4">
            {businessCards?.map((card) => (
              <Card key={card.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-lg">{card.employeeName}</span>
                        {getStatusBadge(card.cardStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">سمت:</span>
                            <span>{card.jobTitle}</span>
                          </div>
                          {card.department && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{card.department}</span>
                            </div>
                          )}
                          {card.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{card.email}</span>
                            </div>
                          )}
                          {card.mobilePhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{card.mobilePhone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">طراحی:</span>
                            <Badge variant="outline">{card.cardDesign}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">رنگ:</span>
                            <Badge variant="outline">{card.cardColor}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">تعداد چاپ:</span>
                            <span>{card.printQuantity}</span>
                          </div>
                          {card.includeQrCode && (
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              <span>QR Code دارد</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" title="پیش‌نمایش">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="ویرایش"
                        onClick={() => {
                          setEditingItem(card);
                          setIsAddingBusinessCard(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {card.cardStatus === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          title="تایید"
                          onClick={() => approveBusinessCardMutation.mutate(card.id!)}
                          disabled={approveBusinessCardMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" title="چاپ">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        title="حذف"
                        onClick={() => {
                          if (window.confirm('آیا مطمئن هستید که می‌خواهید این کارت‌ویزیت را حذف کنید؟')) {
                            deleteBusinessCardMutation.mutate(card.id!);
                          }
                        }}
                        disabled={deleteBusinessCardMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {card.specialNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <span className="font-medium">یادداشت‌ها: </span>
                      {card.specialNotes}
                    </div>
                  )}
                  
                  {card.lastPrintDate && (
                    <div className="mt-2 text-xs text-gray-500">
                      آخرین چاپ: {new Date(card.lastPrintDate).toLocaleDateString('fa-IR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {(!businessCards || businessCards.length === 0) && (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">کارت‌ویزیتی موجود نیست</h3>
                <p className="mt-2 text-gray-500">برای شروع، اولین کارت‌ویزیت را ایجاد کنید</p>
                <Button 
                  onClick={() => setIsAddingBusinessCard(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  کارت‌ویزیت جدید
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Business Card Add/Edit Dialog */}
      <Dialog open={isAddingBusinessCard} onOpenChange={setIsAddingBusinessCard}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'ویرایش کارت‌ویزیت' : 'افزودن کارت‌ویزیت جدید'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const businessCardData: BusinessCard = {
              employeeName: formData.get('employeeName') as string,
              jobTitle: formData.get('jobTitle') as string,
              department: formData.get('department') as string || undefined,
              employeeNameArabic: formData.get('employeeNameArabic') as string || undefined,
              employeeNameKurdish: formData.get('employeeNameKurdish') as string || undefined,
              jobTitleArabic: formData.get('jobTitleArabic') as string || undefined,
              jobTitleKurdish: formData.get('jobTitleKurdish') as string || undefined,
              directPhone: formData.get('directPhone') as string || undefined,
              mobilePhone: formData.get('mobilePhone') as string || undefined,
              email: formData.get('email') as string || undefined,
              officeLocation: formData.get('officeLocation') as string || undefined,
              linkedinProfile: formData.get('linkedinProfile') as string || undefined,
              whatsappNumber: formData.get('whatsappNumber') as string || undefined,
              cardDesign: (formData.get('cardDesign') as 'standard' | 'executive' | 'creative') || 'standard',
              cardColor: formData.get('cardColor') as string || 'blue',
              includeQrCode: formData.get('includeQrCode') === 'on',
              qrCodeData: formData.get('qrCodeData') as string || undefined,
              specialNotes: formData.get('specialNotes') as string || undefined,
              printQuantity: parseInt(formData.get('printQuantity') as string) || 500,
              isActive: formData.get('isActive') === 'on',
              cardStatus: 'draft'
            };

            if (editingItem) {
              updateBusinessCardMutation.mutate({ id: editingItem.id, data: businessCardData });
            } else {
              addBusinessCardMutation.mutate(businessCardData);
            }
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">اطلاعات کارمند</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">نام کارمند *</label>
                  <input
                    name="employeeName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.employeeName || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">سمت/موقعیت *</label>
                  <input
                    name="jobTitle"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.jobTitle || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">سمت عربی</label>
                  <input
                    name="jobTitleArabic"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.jobTitleArabic || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">سمت کردی</label>
                  <input
                    name="jobTitleKurdish"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.jobTitleKurdish || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">بخش/دپارتمان</label>
                  <input
                    name="department"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.department || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">نام عربی</label>
                  <input
                    name="employeeNameArabic"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.employeeNameArabic || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">نام کردی</label>
                  <input
                    name="employeeNameKurdish"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.employeeNameKurdish || ''}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">اطلاعات تماس</h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">تلفن مستقیم</label>
                  <input
                    name="directPhone"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.directPhone || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">موبایل</label>
                  <input
                    name="mobilePhone"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.mobilePhone || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">ایمیل</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.email || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">محل دفتر</label>
                  <input
                    name="officeLocation"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.officeLocation || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">پروفایل LinkedIn</label>
                  <input
                    name="linkedinProfile"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.linkedinProfile || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">شماره واتساپ</label>
                  <input
                    name="whatsappNumber"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.whatsappNumber || ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">تعداد چاپ</label>
                  <input
                    name="printQuantity"
                    type="number"
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.printQuantity || 500}
                  />
                </div>
              </div>
            </div>

            {/* Card Design Options */}
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">تنظیمات کارت‌ویزیت</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">طراحی کارت</label>
                  <select 
                    name="cardDesign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.cardDesign || 'standard'}
                  >
                    <option value="standard">استاندارد</option>
                    <option value="executive">اجرایی</option>
                    <option value="creative">خلاقانه</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">رنگ کارت</label>
                  <input
                    name="cardColor"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.cardColor || 'blue'}
                    placeholder="blue, red, green, etc."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  name="includeQrCode"
                  type="checkbox"
                  id="includeQrCode"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked={editingItem?.includeQrCode || false}
                />
                <label htmlFor="includeQrCode" className="text-sm font-medium">
                  شامل QR Code
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">داده‌های QR Code</label>
                <input
                  name="qrCodeData"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.qrCodeData || ''}
                  placeholder="vCard data, URL, یا اطلاعات تماس"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">یادداشت‌های ویژه</label>
                <textarea
                  name="specialNotes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  defaultValue={editingItem?.specialNotes || ''}
                  placeholder="درخواست‌های خاص برای طراحی یا چاپ..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  name="isActive"
                  type="checkbox"
                  id="isActive"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked={editingItem?.isActive ?? true}
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  فعال
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddingBusinessCard(false);
                setEditingItem(null);
              }}>
                انصراف
              </Button>
              <Button 
                type="submit" 
                disabled={addBusinessCardMutation.isPending || updateBusinessCardMutation.isPending}
              >
                {addBusinessCardMutation.isPending || updateBusinessCardMutation.isPending ? 'در حال ذخیره...' : editingItem ? 'به‌روزرسانی' : 'ذخیره'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}