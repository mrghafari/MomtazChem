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
  Hash,
  Search,
  Image,
  Eye,
  X
} from 'lucide-react';

interface CompanyInfo {
  id?: number;
  companyName: string;
  companyNameEnglish?: string;
  registrationNumber?: string;
  taxNumber?: string;
  address: string;
  addressEnglish?: string;
  city: string;
  province: string;
  country: string;
  postalCode?: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  businessType?: string;
  industry: string;
  establishedYear?: number;
  logoUrl?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  description?: string;
  descriptionEnglish?: string;
  isActive?: boolean;
}

interface CompanyImage {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags?: string;
  isActive?: boolean;
  uploadedAt?: string;
  uploadedBy?: number;
  createdAt?: string;
  updatedAt?: string;
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

interface CompanyImage {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags?: string;
  isActive: boolean;
  uploadedAt?: string;
}

export default function CompanyInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isAddingIncoming, setIsAddingIncoming] = useState(false);
  const [isAddingOutgoing, setIsAddingOutgoing] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isAddingBusinessCard, setIsAddingBusinessCard] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageView, setSelectedImageView] = useState<CompanyImage | null>(null);

  // Fetch company information from database
  const { data: companyInfo, isLoading: infoLoading } = useQuery<CompanyInfo>({
    queryKey: ['/api/admin/company-information'],
    queryFn: async () => {
      const response = await fetch('/api/admin/company-information', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch company information');
      const result = await response.json();
      return result.data || null;
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

  // Fetch company images
  const { data: companyImages } = useQuery<CompanyImage[]>({
    queryKey: ['/api/company-images'],
    queryFn: async () => {
      const response = await fetch('/api/company-images', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch company images');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Update company info mutation using database API
  const updateCompanyInfoMutation = useMutation({
    mutationFn: async (data: CompanyInfo) => {
      const response = await apiRequest('/api/admin/company-information', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "اطلاعات شرکت با موفقیت در دیتابیس ذخیره شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-information'] });
    },
    onError: (error) => {
      console.error('Error updating company information:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در ذخیره اطلاعات شرکت در دیتابیس", 
        variant: "destructive" 
      });
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

  // Company Images mutations
  const addImageMutation = useMutation({
    mutationFn: async (data: CompanyImage) => {
      const response = await apiRequest('/api/company-images', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "تصویر جدید با موفقیت اضافه شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/company-images'] });
      setIsAddingImage(false);
    },
    onError: (error) => {
      console.error('Error adding image:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در اضافه کردن تصویر", 
        variant: "destructive" 
      });
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompanyImage }) => {
      const response = await apiRequest(`/api/company-images/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "تصویر با موفقیت به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/company-images'] });
      setEditingItem(null);
    },
    onError: (error) => {
      console.error('Error updating image:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در به‌روزرسانی تصویر", 
        variant: "destructive" 
      });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/company-images/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "تصویر حذف شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/company-images'] });
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast({ 
        title: "خطا", 
        description: "خطا در حذف تصویر", 
        variant: "destructive" 
      });
    }
  });

  // Search and filter functions
  const filterBySearch = (items: any[], searchFields: string[]) => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  };

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

      {/* Search Bar - Global */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="جستجو در تمام بخش‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            اطلاعات کلی
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            تصاویر ({companyImages?.length || 0})
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
                  <Label>نام شرکت</Label>
                  <Input 
                    id="companyName"
                    value={companyInfo?.companyName || ''} 
                    placeholder="شرکت ممتاز شیمی"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, companyName: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name (English)</Label>
                  <Input 
                    id="companyNameEnglish"
                    value={companyInfo?.companyNameEnglish || ''} 
                    placeholder="Momtaz Chemical Solutions"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, companyNameEnglish: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صنعت</Label>
                  <Input 
                    id="industry"
                    value={companyInfo?.industry || ''} 
                    placeholder="شیمیایی"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, industry: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع کسب‌وکار</Label>
                  <Input 
                    id="businessType"
                    value={companyInfo?.businessType || ''} 
                    placeholder="تولیدی"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, businessType: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>سال تأسیس</Label>
                  <Input 
                    id="establishedYear"
                    type="number"
                    value={companyInfo?.establishedYear || ''} 
                    placeholder="1400"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, establishedYear: parseInt(e.target.value) || null };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>سایت وب</Label>
                  <Input 
                    id="website"
                    value={companyInfo?.website || ''} 
                    placeholder="https://momtazchem.com"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, website: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>لوگوی شرکت</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="logoUrl"
                      value={companyInfo?.logoUrl || ''} 
                      placeholder="آدرس URL لوگو"
                      onChange={(e) => {
                        const updatedInfo = { ...companyInfo, logoUrl: e.target.value };
                        updateCompanyInfoMutation.mutate(updatedInfo);
                      }}
                    />
                    <Button size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
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
                    id="email"
                    value={companyInfo?.email || ''} 
                    placeholder="info@momtazchem.com"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, email: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تلفن اصلی</Label>
                  <Input 
                    id="phone"
                    value={companyInfo?.phone || ''} 
                    placeholder="+964 750 123 4567"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, phone: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>فکس</Label>
                  <Input 
                    id="fax"
                    value={companyInfo?.fax || ''} 
                    placeholder="+964 750 123 4569"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, fax: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>آدرس</Label>
                  <Textarea 
                    id="address"
                    value={companyInfo?.address || ''} 
                    placeholder="آدرس کامل شرکت"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, address: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address (English)</Label>
                  <Textarea 
                    id="addressEnglish"
                    value={companyInfo?.addressEnglish || ''} 
                    placeholder="Company Full Address in English"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, addressEnglish: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
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
                    id="registrationNumber"
                    value={companyInfo?.registrationNumber || ''} 
                    placeholder="123456789"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, registrationNumber: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شماره مالیاتی</Label>
                  <Input 
                    id="taxNumber"
                    value={companyInfo?.taxNumber || ''} 
                    placeholder="987654321"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, taxNumber: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شهر</Label>
                  <Input 
                    id="city"
                    value={companyInfo?.city || ''} 
                    placeholder="اربیل"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, city: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>استان</Label>
                  <Input 
                    id="province"
                    value={companyInfo?.province || ''} 
                    placeholder="کردستان عراق"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, province: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>کشور</Label>
                  <Input 
                    id="country"
                    value={companyInfo?.country || ''} 
                    placeholder="عراق"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, country: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>کد پستی</Label>
                  <Input 
                    id="postalCode"
                    value={companyInfo?.postalCode || ''} 
                    placeholder="12345"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, postalCode: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
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
                <CardDescription>درباره شرکت و فعالیت‌های آن</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>درباره شرکت</Label>
                  <Textarea 
                    id="description"
                    value={companyInfo?.description || ''} 
                    placeholder="توضیح کاملی از شرکت و فعالیت‌های آن..."
                    rows={3}
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, description: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Textarea 
                    id="descriptionEnglish"
                    value={companyInfo?.descriptionEnglish || ''} 
                    placeholder="Complete description about company and its activities..."
                    rows={3}
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, descriptionEnglish: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  اطلاعات بانکی
                </CardTitle>
                <CardDescription>حساب‌های بانکی و اطلاعات مالی</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نام بانک</Label>
                  <Input 
                    id="bankName"
                    value={companyInfo?.bankName || ''} 
                    placeholder="بانک ملی عراق"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, bankName: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شماره حساب</Label>
                  <Input 
                    id="accountNumber"
                    value={companyInfo?.accountNumber || ''} 
                    placeholder="1234567890"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, accountNumber: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شماره IBAN</Label>
                  <Input 
                    id="iban"
                    value={companyInfo?.iban || ''} 
                    placeholder="IQ123456789012345678"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, iban: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>کد SWIFT</Label>
                  <Input 
                    id="swiftCode"
                    value={companyInfo?.swiftCode || ''} 
                    placeholder="BANKIQ22"
                    onChange={(e) => {
                      const updatedInfo = { ...companyInfo, swiftCode: e.target.value };
                      updateCompanyInfoMutation.mutate(updatedInfo);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auto-save notification */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle className="h-4 w-4" />
              تغییرات به‌صورت خودکار در دیتابیس ذخیره می‌شوند
            </div>
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    کارت‌ویزیت‌های دریافتی
                  </CardTitle>
                  <CardDescription>مدیریت و مشاهده کارت‌ویزیت‌های دریافت شده از مشتریان و شرکا</CardDescription>
                </div>
                <Button onClick={() => setIsAddingBusinessCard(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  آپلود کارت‌ویزیت جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBySearch(businessCards || [], ['employeeName', 'jobTitle', 'mobile', 'email', 'specialNotes']).map((card) => (
                  <div key={card.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="aspect-[5/3] bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                      {card.cardDesignUrl ? (
                        <img 
                          src={card.cardDesignUrl} 
                          alt={`کارت‌ویزیت ${card.employeeName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-card.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <User className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs">تصویر کارت‌ویزیت</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{card.employeeName}</h4>
                      <p className="text-xs text-gray-600">{card.jobTitle}</p>
                      {card.department && (
                        <p className="text-xs text-blue-600 font-medium">{card.department}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 text-xs">
                        {card.mobile && (
                          <Badge variant="outline" className="text-xs">
                            📞 {card.mobile}
                          </Badge>
                        )}
                        {card.email && (
                          <Badge variant="outline" className="text-xs">
                            ✉️ {card.email}
                          </Badge>
                        )}
                      </div>
                      
                      {card.specialNotes && (
                        <p className="text-xs text-gray-500 line-clamp-2">{card.specialNotes}</p>
                      )}
                      
                      <div className="flex justify-between items-center pt-2">
                        <Badge variant="outline" className="text-xs">
                          {card.createdAt ? new Date(card.createdAt).toLocaleDateString('fa-IR') : 'تاریخ نامشخص'}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedImageView(card)}
                            title="مشاهده"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(card);
                              setIsAddingBusinessCard(true);
                            }}
                            title="ویرایش"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('آیا مطمئن هستید که می‌خواهید این کارت‌ویزیت را حذف کنید؟')) {
                                deleteBusinessCardMutation.mutate(card.id!);
                              }
                            }}
                            disabled={deleteBusinessCardMutation.isPending}
                            title="حذف"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {(!businessCards || businessCards.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">هنوز کارت‌ویزیتی آپلود نشده</h3>
                  <p className="text-sm mb-4">کارت‌ویزیت‌های دریافتی از مشتریان و شرکا را اینجا آپلود کنید</p>
                  <Button onClick={() => setIsAddingBusinessCard(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    اولین کارت‌ویزیت را آپلود کنید
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    تصاویر شرکت
                  </CardTitle>
                  <CardDescription>مدیریت تصاویر و گالری شرکت</CardDescription>
                </div>
                <Button onClick={() => setIsAddingImage(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن تصویر جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBySearch(companyImages || [], ['title', 'description', 'category', 'tags']).map((image) => (
                  <div key={image.id} className="border rounded-lg p-4 space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image.imageUrl} 
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{image.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{image.description}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {image.category}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedImageView(image)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(image);
                              setIsAddingImage(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteImageMutation.mutate(image.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!companyImages || companyImages.length === 0) && !searchQuery && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>هیچ تصویری موجود نیست</p>
                  </div>
                )}

                {searchQuery && filterBySearch(companyImages || [], ['title', 'description', 'category', 'tags']).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>نتیجه‌ای برای "{searchQuery}" پیدا نشد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Business Card Upload Dialog */}
      <Dialog open={isAddingBusinessCard} onOpenChange={setIsAddingBusinessCard}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'ویرایش کارت‌ویزیت دریافتی' : 'آپلود کارت‌ویزیت جدید'}
            </DialogTitle>
            <DialogDescription>
              کارت‌ویزیت دریافت شده از مشتری یا شریک تجاری را آپلود کنید
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const businessCardData: BusinessCard = {
              employeeName: formData.get('employeeName') as string,
              jobTitle: formData.get('jobTitle') as string,
              department: formData.get('department') as string || undefined,
              mobile: formData.get('mobile') as string || undefined,
              email: formData.get('email') as string || undefined,
              specialNotes: formData.get('specialNotes') as string || undefined,
              cardDesignUrl: formData.get('cardDesignUrl') as string || undefined,
              // Set default values for upload system
              cardDesign: 'standard',
              cardColor: 'blue',
              includeQrCode: false,
              printQuantity: 1,
              isActive: true,
              cardStatus: 'active'
            };

            if (editingItem) {
              updateBusinessCardMutation.mutate({ id: editingItem.id, data: businessCardData });
            } else {
              addBusinessCardMutation.mutate(businessCardData);
            }
          }}>
            <div className="space-y-6">
              {/* Card Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">تصویر کارت‌ویزیت</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">کلیک کنید تا آپلود کنید</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG، JPG یا JPEG (حداکثر 5MB)</p>
                    </div>
                    <input 
                      name="cardImage" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">نام فرد *</label>
                  <input
                    name="employeeName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.employeeName || ''}
                    placeholder="نام شخص روی کارت‌ویزیت"
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
                    placeholder="سمت شغلی"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">نام شرکت</label>
                  <input
                    name="department"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.department || ''}
                    placeholder="نام شرکت یا سازمان"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">شماره تماس</label>
                  <input
                    name="mobile"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.mobile || ''}
                    placeholder="شماره موبایل یا تلفن"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium">ایمیل</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem?.email || ''}
                    placeholder="آدرس ایمیل"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">یادداشت‌ها</label>
                <textarea
                  name="specialNotes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.specialNotes || ''}
                  placeholder="یادداشت‌های اضافی در مورد این کارت‌ویزیت یا شخص..."
                />
              </div>

              {/* URL Field for uploaded image */}
              <input
                name="cardDesignUrl"
                type="hidden"
                defaultValue={editingItem?.cardDesignUrl || ''}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingBusinessCard(false);
                  setEditingItem(null);
                }}
              >
                انصراف
              </Button>
              <Button 
                type="submit" 
                disabled={addBusinessCardMutation.isPending || updateBusinessCardMutation.isPending}
              >
                {addBusinessCardMutation.isPending || updateBusinessCardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : editingItem ? (
                  'به‌روزرسانی کارت‌ویزیت'
                ) : (
                  'ذخیره کارت‌ویزیت'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Company Image Add/Edit Dialog */}
      <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'ویرایش تصویر' : 'افزودن تصویر جدید'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const imageData: CompanyImage = {
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              imageUrl: formData.get('imageUrl') as string,
              category: formData.get('category') as string,
              tags: formData.get('tags') as string || undefined,
              isActive: formData.get('isActive') === 'on'
            };

            if (editingItem) {
              updateImageMutation.mutate({ id: editingItem.id, data: imageData });
            } else {
              addImageMutation.mutate(imageData);
            }
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">عنوان تصویر *</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.title || ''}
                  placeholder="عنوان تصویر..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">توضیحات *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.description || ''}
                  placeholder="توضیحات کامل تصویر..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">URL تصویر *</label>
                <input
                  name="imageUrl"
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.imageUrl || ''}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">دسته‌بندی *</label>
                <Select name="category" defaultValue={editingItem?.category || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">لوگو</SelectItem>
                    <SelectItem value="building">ساختمان</SelectItem>
                    <SelectItem value="products">محصولات</SelectItem>
                    <SelectItem value="team">تیم</SelectItem>
                    <SelectItem value="certificates">گواهینامه‌ها</SelectItem>
                    <SelectItem value="equipment">تجهیزات</SelectItem>
                    <SelectItem value="gallery">گالری</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">برچسب‌ها</label>
                <input
                  name="tags"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingItem?.tags || ''}
                  placeholder="برچسب1, برچسب2, برچسب3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  name="isActive"
                  type="checkbox"
                  id="imageIsActive"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked={editingItem?.isActive ?? true}
                />
                <label htmlFor="imageIsActive" className="text-sm font-medium">
                  فعال
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddingImage(false);
                setEditingItem(null);
              }}>
                انصراف
              </Button>
              <Button 
                type="submit" 
                disabled={addImageMutation.isPending || updateImageMutation.isPending}
              >
                {addImageMutation.isPending || updateImageMutation.isPending ? 'در حال ذخیره...' : editingItem ? 'به‌روزرسانی' : 'ذخیره'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={!!selectedImageView} onOpenChange={() => setSelectedImageView(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedImageView?.title}</DialogTitle>
            <DialogDescription>{selectedImageView?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedImageView && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={selectedImageView.imageUrl} 
                  alt={selectedImageView.title}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">دسته‌بندی:</span>
                  <Badge variant="outline" className="mr-2">
                    {selectedImageView.category}
                  </Badge>
                </div>
                {selectedImageView.tags && (
                  <div>
                    <span className="font-medium">برچسب‌ها:</span>
                    <span className="mr-2">{selectedImageView.tags}</span>
                  </div>
                )}
                {selectedImageView.uploadedAt && (
                  <div>
                    <span className="font-medium">تاریخ آپلود:</span>
                    <span className="mr-2">{new Date(selectedImageView.uploadedAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">وضعیت:</span>
                  <Badge variant={selectedImageView.isActive ? "default" : "secondary"} className="mr-2">
                    {selectedImageView.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}