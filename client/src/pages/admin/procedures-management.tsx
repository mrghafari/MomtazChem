import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  FileText, 
  Shield, 
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Search,
  Filter,
  Download,
  Upload,
  Users,
  Calendar,
  Tag,
  Layers,
  Settings,
  Award,
  TrendingUp,
  FilePlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Types for procedures management
interface ProcedureCategory {
  id: number;
  name: string;
  description: string;
  colorCode: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Procedure {
  id: number;
  title: string;
  categoryId: number;
  description: string;
  content: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'critical';
  language: string;
  authorId: number;
  approverId?: number;
  approvedAt?: string;
  effectiveDate?: string;
  reviewDate?: string;
  tags: string[];
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcedureStep {
  id: number;
  procedureId: number;
  stepNumber: number;
  title: string;
  description: string;
  instructions: string;
  estimatedTime?: number;
  requiredTools: string[];
  safetyNotes?: string;
  qualityCheckpoints: string[];
  isCritical: boolean;
  createdAt: string;
}

interface SafetyProtocol {
  id: number;
  title: string;
  category: string;
  description: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredPpe: string[];
  procedures: string;
  firstAidSteps?: string;
  evacuationPlan?: string;
  isMandatory: boolean;
  complianceNotes?: string;
  lastUpdatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProcedureDocument {
  id: number;
  procedureId: number;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  uploadedBy: number;
  uploadedByName?: string;
  version: string;
  isActive: boolean;
  downloadCount: number;
  lastDownloadedAt?: string;
  tags: string[];
}

// Form schemas
const procedureCategorySchema = z.object({
  name: z.string().min(3, "نام دسته‌بندی باید حداقل 3 کاراکتر باشد"),
  description: z.string().optional(),
  colorCode: z.string().default("#3b82f6"),
  displayOrder: z.number().min(0).default(0),
});

const procedureSchema = z.object({
  title: z.string().min(5, "عنوان باید حداقل 5 کاراکتر باشد"),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  description: z.string().optional(),
  content: z.string().min(10, "محتوای دستورالعمل را وارد کنید"),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  effectiveDate: z.string().optional(),
  reviewDate: z.string().optional(),
  tags: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'restricted', 'confidential']),
});

const safetyProtocolSchema = z.object({
  title: z.string().min(5, "عنوان را وارد کنید"),
  category: z.string().min(3, "دسته‌بندی را وارد کنید"),
  description: z.string().optional(),
  severityLevel: z.enum(['low', 'medium', 'high', 'critical']),
  procedures: z.string().min(10, "روش‌های ایمنی را شرح دهید"),
  firstAidSteps: z.string().optional(),
  evacuationPlan: z.string().optional(),
  requiredPpe: z.string().optional(),
});

type ProcedureCategoryForm = z.infer<typeof procedureCategorySchema>;
type ProcedureForm = z.infer<typeof procedureSchema>;
type SafetyProtocolForm = z.infer<typeof safetyProtocolSchema>;

export default function ProceduresManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'procedure' | 'safety' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  // Form hooks
  const categoryForm = useForm<ProcedureCategoryForm>({
    resolver: zodResolver(procedureCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      colorCode: "#3b82f6",
      displayOrder: 0,
    },
  });

  const procedureForm = useForm<ProcedureForm>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      description: "",
      content: "",
      priority: "normal",
      effectiveDate: "",
      reviewDate: "",
      tags: "",
      accessLevel: "public",
    },
  });

  const safetyForm = useForm<SafetyProtocolForm>({
    resolver: zodResolver(safetyProtocolSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      severityLevel: "medium",
      procedures: "",
      firstAidSteps: "",
      evacuationPlan: "",
      requiredPpe: "",
    },
  });

  // Data fetching
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ProcedureCategory[]>({
    queryKey: ["/api/procedures/categories"],
  });

  const { data: procedures = [], isLoading: proceduresLoading } = useQuery<Procedure[]>({
    queryKey: ["/api/procedures"],
  });

  const { data: safetyProtocols = [], isLoading: safetyLoading } = useQuery<SafetyProtocol[]>({
    queryKey: ["/api/procedures/safety-protocols"],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<ProcedureDocument[]>({
    queryKey: ["/api/procedures", selectedProcedureId, "documents"],
    enabled: !!selectedProcedureId,
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredProcedures = procedures.filter(procedure => {
    const matchesSearch = searchQuery === "" || 
      procedure.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      procedure.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      procedure.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
      procedure.categoryId.toString() === selectedCategory;
    
    const matchesStatus = selectedStatus === "all" || 
      procedure.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Export procedure handler
  const exportProcedure = async (procedureId: number) => {
    try {
      const response = await fetch(`/api/procedures/${procedureId}/export`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export procedure');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `procedure-${procedureId}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "موفقیت",
        description: "فایل دستورالعمل با موفقیت دانلود شد",
      });
    } catch (error) {
      console.error('Error exporting procedure:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در دانلود فایل رخ داده است",
      });
    }
  };

  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/procedures/documents/${documentId}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "موفقیت",
        description: "سند با موفقیت دانلود شد",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در دانلود سند رخ داده است",
      });
    }
  };

  const viewProcedureDocuments = (procedureId: number) => {
    setSelectedProcedureId(procedureId);
    setShowDocuments(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Dialog handlers
  const openCreateDialog = (type: 'category' | 'procedure' | 'safety') => {
    setDialogType(type);
    setEditingItem(null);
    setDocumentFiles([]);
    setDialogOpen(true);
  };

  const openEditDialog = (type: 'category' | 'procedure' | 'safety', item: any) => {
    setDialogType(type);
    setEditingItem(item);
    
    if (type === 'procedure') {
      procedureForm.reset({
        title: item.title,
        categoryId: item.categoryId?.toString() || "",
        description: item.description || "",
        content: item.content || "",
        priority: item.priority || "normal",
        effectiveDate: item.effectiveDate ? new Date(item.effectiveDate).toISOString().split('T')[0] : "",
        reviewDate: item.reviewDate ? new Date(item.reviewDate).toISOString().split('T')[0] : "",
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : "",
        accessLevel: item.accessLevel || "public",
      });
    } else if (type === 'category') {
      categoryForm.reset({
        name: item.name,
        description: item.description || "",
        colorCode: item.colorCode || "#3b82f6",
        displayOrder: item.displayOrder || 0,
      });
    } else if (type === 'safety') {
      safetyForm.reset({
        title: item.title,
        category: item.category,
        description: item.description || "",
        severityLevel: item.severityLevel,
        procedures: item.procedures,
        firstAidSteps: item.firstAidSteps || "",
        evacuationPlan: item.evacuationPlan || "",
        requiredPpe: Array.isArray(item.requiredPpe) ? item.requiredPpe.join(', ') : item.requiredPpe || "",
      });
    }
    
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setEditingItem(null);
    setDocumentFiles([]);
    categoryForm.reset();
    procedureForm.reset();
    safetyForm.reset();
  };

  // Document upload handlers
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setDocumentFiles(Array.from(files));
    }
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission handlers
  const onSubmitProcedure = async (data: ProcedureForm) => {
    try {
      const formData = new FormData();
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      let response;
      if (editingItem) {
        // Update existing procedure
        response = await fetch(`/api/procedures/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
      } else {
        // Create new procedure
        response = await fetch('/api/procedures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        // Upload documents if any
        if (documentFiles.length > 0 && result.procedure?.id) {
          await uploadDocuments(result.procedure.id);
        }

        toast({
          title: "موفقیت",
          description: editingItem ? "دستورالعمل با موفقیت به‌روزرسانی شد" : "دستورالعمل جدید ایجاد شد",
        });
        
        closeDialog();
        queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error submitting procedure:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در ذخیره دستورالعمل رخ داده است",
      });
    }
  };

  const uploadDocuments = async (procedureId: number) => {
    for (const file of documentFiles) {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', file.name);
      formData.append('description', `فایل ضمیمه: ${file.name}`);

      try {
        await fetch(`/api/procedures/${procedureId}/documents`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
  };

  const onSubmitCategory = async (data: ProcedureCategoryForm) => {
    try {
      let response;
      if (editingItem) {
        // Update existing category
        response = await fetch(`/api/procedures/categories/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
      } else {
        // Create new category
        response = await fetch('/api/procedures/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "موفقیت",
          description: editingItem ? "دسته‌بندی با موفقیت به‌روزرسانی شد" : "دسته‌بندی جدید ایجاد شد",
        });
        
        closeDialog();
        queryClient.invalidateQueries({ queryKey: ["/api/procedures/categories"] });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در ذخیره دسته‌بندی رخ داده است",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/admin')}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          بازگشت به داشبورد
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          مدیریت دستورالعمل‌ها و روش‌ها
        </h1>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="procedures">دستورالعمل‌ها</TabsTrigger>
          <TabsTrigger value="categories">دسته‌بندی‌ها</TabsTrigger>
          <TabsTrigger value="safety">پروتکل‌های ایمنی</TabsTrigger>
          <TabsTrigger value="analytics">گزارش‌ها</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل دستورالعمل‌ها</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{procedures.length}</div>
                <p className="text-xs text-muted-foreground">
                  تأیید شده: {procedures.filter(p => p.status === 'approved').length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">در انتظار بررسی</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {procedures.filter(p => p.status === 'review').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  نیاز به تأیید
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">پروتکل‌های ایمنی</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safetyProtocols.length}</div>
                <p className="text-xs text-muted-foreground">
                  بحرانی: {safetyProtocols.filter(p => p.severityLevel === 'critical').length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">دسته‌بندی‌ها</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  فعال: {categories.filter(c => c.isActive).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Procedures */}
          <Card>
            <CardHeader>
              <CardTitle>آخرین دستورالعمل‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {procedures.slice(0, 5).map((procedure) => (
                  <div key={procedure.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{procedure.title}</p>
                          <p className="text-xs text-muted-foreground">نسخه: {procedure.version}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(procedure.priority)}>
                        {procedure.priority === 'critical' ? 'بحرانی' :
                         procedure.priority === 'high' ? 'بالا' :
                         procedure.priority === 'normal' ? 'عادی' : 'پایین'}
                      </Badge>
                      <Badge className={getStatusColor(procedure.status)}>
                        {procedure.status === 'approved' ? 'تأیید شده' :
                         procedure.status === 'review' ? 'در بررسی' :
                         procedure.status === 'draft' ? 'پیش‌نویس' : 'بایگانی'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procedures Tab */}
        <TabsContent value="procedures" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>دستورالعمل‌ها</CardTitle>
                <Button onClick={() => openCreateDialog('procedure')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن دستورالعمل
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در دستورالعمل‌ها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="approved">تأیید شده</SelectItem>
                    <SelectItem value="review">در بررسی</SelectItem>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                    <SelectItem value="archived">بایگانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {proceduresLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>نسخه</TableHead>
                      <TableHead>اولویت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>اسناد آپلودی</TableHead>
                      <TableHead>بازدید</TableHead>
                      <TableHead>تاریخ ایجاد</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProcedures.map((procedure) => {
                      const category = categories.find(c => c.id === procedure.categoryId);
                      return (
                        <TableRow key={procedure.id}>
                          <TableCell className="font-medium">{procedure.title}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: category?.colorCode + '20', borderColor: category?.colorCode }}
                            >
                              {category?.name || 'نامشخص'}
                            </Badge>
                          </TableCell>
                          <TableCell>{procedure.version}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(procedure.priority)}>
                              {procedure.priority === 'critical' ? 'بحرانی' :
                               procedure.priority === 'high' ? 'بالا' :
                               procedure.priority === 'normal' ? 'عادی' : 'پایین'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(procedure.status)}>
                              {procedure.status === 'approved' ? 'تأیید شده' :
                               procedure.status === 'review' ? 'در بررسی' :
                               procedure.status === 'draft' ? 'پیش‌نویس' : 'بایگانی'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewProcedureDocuments(procedure.id)}
                              title="مشاهده اسناد آپلودی"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              اسناد
                            </Button>
                          </TableCell>
                          <TableCell>{procedure.viewCount}</TableCell>
                          <TableCell>
                            {new Date(procedure.createdAt).toLocaleDateString('fa-IR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => exportProcedure(procedure.id)}
                                title="دانلود فایل دستورالعمل"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog('procedure', procedure)}
                                title="ویرایش دستورالعمل"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>دسته‌بندی‌ها</CardTitle>
                <Button onClick={() => openCreateDialog('category')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن دسته‌بندی
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="border-2">
                      <CardHeader 
                        className="pb-3"
                        style={{ backgroundColor: category.colorCode + '10' }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{category.name}</h3>
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.colorCode }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>دستورالعمل‌ها:</span>
                            <span>{procedures.filter(p => p.categoryId === category.id).length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>ترتیب نمایش:</span>
                            <span>{category.displayOrder}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>وضعیت:</span>
                            <Badge variant={category.isActive ? "default" : "secondary"}>
                              {category.isActive ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Protocols Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>پروتکل‌های ایمنی</CardTitle>
                <Button onClick={() => openCreateDialog('safety')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن پروتکل ایمنی
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {safetyLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safetyProtocols.map((protocol) => (
                    <Card key={protocol.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold flex items-center gap-2">
                            {getSeverityIcon(protocol.severityLevel)}
                            {protocol.title}
                          </h3>
                          <Badge 
                            className={
                              protocol.severityLevel === 'critical' ? 'bg-red-100 text-red-800' :
                              protocol.severityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                              protocol.severityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {protocol.severityLevel === 'critical' ? 'بحرانی' :
                             protocol.severityLevel === 'high' ? 'بالا' :
                             protocol.severityLevel === 'medium' ? 'متوسط' : 'پایین'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{protocol.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>دسته‌بندی:</span>
                            <span>{protocol.category}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>الزامی:</span>
                            <Badge variant={protocol.isMandatory ? "default" : "secondary"}>
                              {protocol.isMandatory ? 'بله' : 'خیر'}
                            </Badge>
                          </div>
                          {protocol.requiredPpe.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">تجهیزات ایمنی:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {protocol.requiredPpe.map((ppe, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {ppe}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  آمار استفاده از دستورالعمل‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>مجموع بازدید:</span>
                    <span className="font-semibold">
                      {procedures.reduce((sum, p) => sum + p.viewCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>میانگین بازدید:</span>
                    <span className="font-semibold">
                      {Math.round(procedures.reduce((sum, p) => sum + p.viewCount, 0) / procedures.length || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>پربازدیدترین:</span>
                    <span className="font-semibold text-green-600">
                      {Math.max(...procedures.map(p => p.viewCount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  وضعیت تأیید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>تأیید شده:</span>
                    <span className="font-semibold text-green-600">
                      {procedures.filter(p => p.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>در انتظار بررسی:</span>
                    <span className="font-semibold text-yellow-600">
                      {procedures.filter(p => p.status === 'review').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>پیش‌نویس:</span>
                    <span className="font-semibold text-blue-600">
                      {procedures.filter(p => p.status === 'draft').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Documents Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>اسناد آپلود شده</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {documentsLoading ? (
              <div className="text-center py-8">در حال بارگذاری اسناد...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هیچ سندی برای این دستورالعمل آپلود نشده است
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <Card key={document.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">{document.title}</h3>
                            <Badge variant="outline">نسخه {document.version}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">نام فایل:</span>
                              <p className="truncate">{document.fileName}</p>
                            </div>
                            <div>
                              <span className="font-medium">حجم:</span>
                              <p>{formatFileSize(document.fileSize)}</p>
                            </div>
                            <div>
                              <span className="font-medium">آپلود کننده:</span>
                              <p>{document.uploadedByName || 'نامشخص'}</p>
                            </div>
                            <div>
                              <span className="font-medium">تاریخ آپلود:</span>
                              <p>{new Date(document.uploadDate).toLocaleDateString('fa-IR')}</p>
                            </div>
                          </div>
                          
                          {document.description && (
                            <div className="mb-3">
                              <span className="font-medium text-sm">توضیحات:</span>
                              <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>تعداد دانلود: {document.downloadCount}</span>
                            {document.lastDownloadedAt && (
                              <span>
                                آخرین دانلود: {new Date(document.lastDownloadedAt).toLocaleDateString('fa-IR')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(document.id, document.fileName)}
                            title="دانلود سند"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            دانلود
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDocuments(false)}>
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'category' ? (editingItem ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید') :
               dialogType === 'procedure' ? (editingItem ? 'ویرایش دستورالعمل' : 'ایجاد دستورالعمل جدید') :
               dialogType === 'safety' ? (editingItem ? 'ویرایش پروتکل ایمنی' : 'ایجاد پروتکل ایمنی جدید') : ''}
            </DialogTitle>
          </DialogHeader>

          {dialogType === 'category' && (
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام دسته‌بندی</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="colorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رنگ</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ترتیب نمایش</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ایجاد دسته‌بندی
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'procedure' && (
            <Form {...procedureForm}>
              <form onSubmit={procedureForm.handleSubmit(onSubmitProcedure)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={procedureForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان دستورالعمل</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={procedureForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب دسته‌بندی" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={procedureForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خلاصه توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={procedureForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوای دستورالعمل</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={procedureForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اولویت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">پایین</SelectItem>
                            <SelectItem value="normal">عادی</SelectItem>
                            <SelectItem value="high">بالا</SelectItem>
                            <SelectItem value="critical">بحرانی</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={procedureForm.control}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سطح دسترسی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">عمومی</SelectItem>
                            <SelectItem value="internal">داخلی</SelectItem>
                            <SelectItem value="restricted">محدود</SelectItem>
                            <SelectItem value="confidential">محرمانه</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={procedureForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>برچسب‌ها (با کاما جدا کنید)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="تولید, کیفیت, ایمنی" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={procedureForm.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ اجرا</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={procedureForm.control}
                    name="reviewDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ بازنگری</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Document Upload Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <h3 className="font-medium">آپلود مدارک ضمیمه</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      className="w-full p-2 border rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      فرمت‌های مجاز: PDF, DOC, DOCX, TXT, JPG, PNG
                    </p>
                  </div>

                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">فایل‌های انتخاب شده:</h4>
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'به‌روزرسانی دستورالعمل' : 'ایجاد دستورالعمل'}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'safety' && (
            <Form {...safetyForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={safetyForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان پروتکل</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={safetyForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={safetyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={safetyForm.control}
                  name="procedures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دستورالعمل‌های ایمنی</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={safetyForm.control}
                    name="severityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سطح شدت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">پایین</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">بالا</SelectItem>
                            <SelectItem value="critical">بحرانی</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={safetyForm.control}
                    name="requiredPpe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تجهیزات ایمنی (با کاما جدا کنید)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="عینک, دستکش, ماسک" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={safetyForm.control}
                  name="firstAidSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اقدامات کمک‌های اولیه</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={safetyForm.control}
                  name="evacuationPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>برنامه تخلیه</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ایجاد پروتکل ایمنی
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}