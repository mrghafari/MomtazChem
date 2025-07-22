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

export default function CompanyInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isAddingIncoming, setIsAddingIncoming] = useState(false);
  const [isAddingOutgoing, setIsAddingOutgoing] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
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
        <TabsList className="grid w-full grid-cols-4">
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
      </Tabs>
    </div>
  );
}