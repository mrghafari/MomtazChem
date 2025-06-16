import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Circle,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  Archive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const specialistSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  phone: z.string().optional(),
  department: z.string().min(1, "بخش الزامی است"),
  status: z.enum(["online", "busy", "away", "offline"]),
  expertise: z.string().min(1, "تخصص الزامی است"),
});

type SpecialistForm = z.infer<typeof specialistSchema>;

interface Specialist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  status: string;
  expertise: string[];
  isActive: boolean;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Simple correspondence interface without database complexity
interface CorrespondenceEntry {
  id: string;
  specialistId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  channel: 'email' | 'chat' | 'phone';
  type: 'incoming' | 'outgoing';
  status: 'active' | 'resolved';
  createdAt: string;
  expiresAt: string;
}

export default function SpecialistsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("specialists");
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [correspondenceData, setCorrespondenceData] = useState<CorrespondenceEntry[]>([]);
  const [newCorrespondence, setNewCorrespondence] = useState({
    customerName: '',
    customerEmail: '',
    subject: '',
    message: '',
    channel: 'email' as const,
    type: 'incoming' as const
  });
  const { toast } = useToast();

  const { data: specialists = [], isLoading, refetch } = useQuery<Specialist[]>({
    queryKey: ['/api/admin/specialists'],
  });

  // Load correspondence from localStorage with 30-day expiration
  React.useEffect(() => {
    const loadCorrespondence = () => {
      const stored = localStorage.getItem('specialist_correspondence');
      if (stored) {
        const data: CorrespondenceEntry[] = JSON.parse(stored);
        const now = new Date();
        
        // Filter out expired entries (older than 30 days)
        const validEntries = data.filter(entry => {
          const expiryDate = new Date(entry.expiresAt);
          return expiryDate > now;
        });
        
        // Update localStorage if we removed any expired entries
        if (validEntries.length !== data.length) {
          localStorage.setItem('specialist_correspondence', JSON.stringify(validEntries));
        }
        
        setCorrespondenceData(validEntries);
      }
    };

    loadCorrespondence();
  }, []);

  // Save correspondence to localStorage
  const saveCorrespondence = (data: CorrespondenceEntry[]) => {
    localStorage.setItem('specialist_correspondence', JSON.stringify(data));
    setCorrespondenceData(data);
  };

  // Add new correspondence entry
  const addCorrespondenceEntry = () => {
    if (!selectedSpecialist || !newCorrespondence.customerName || !newCorrespondence.message) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای الزامی را پر کنید",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const entry: CorrespondenceEntry = {
      id: `correspondence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      specialistId: selectedSpecialist,
      customerName: newCorrespondence.customerName,
      customerEmail: newCorrespondence.customerEmail,
      subject: newCorrespondence.subject,
      message: newCorrespondence.message,
      channel: newCorrespondence.channel,
      type: newCorrespondence.type,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    const updatedData = [...correspondenceData, entry];
    saveCorrespondence(updatedData);

    // Reset form
    setNewCorrespondence({
      customerName: '',
      customerEmail: '',
      subject: '',
      message: '',
      channel: 'email',
      type: 'incoming'
    });

    toast({
      title: "موفق",
      description: "مکاتبه با موفقیت ثبت شد",
    });
  };

  // Update correspondence status
  const updateCorrespondenceStatus = (id: string, status: 'active' | 'resolved') => {
    const updatedData = correspondenceData.map(entry =>
      entry.id === id ? { ...entry, status } : entry
    );
    saveCorrespondence(updatedData);
  };

  // Get correspondence for selected specialist
  const getSpecialistCorrespondence = (specialistId: string) => {
    return correspondenceData
      .filter(entry => entry.specialistId === specialistId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Manual cleanup of expired entries
  const cleanupExpiredEntries = () => {
    const now = new Date();
    const validEntries = correspondenceData.filter(entry => {
      const expiryDate = new Date(entry.expiresAt);
      return expiryDate > now;
    });
    
    const removedCount = correspondenceData.length - validEntries.length;
    saveCorrespondence(validEntries);
    
    toast({
      title: "پاکسازی انجام شد",
      description: `${removedCount} مورد منقضی شده حذف شد`,
    });
  };

  const form = useForm<SpecialistForm>({
    resolver: zodResolver(specialistSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: "",
      status: "offline",
      expertise: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SpecialistForm) => {
      const expertiseArray = data.expertise.split("،").map(item => item.trim());
      return apiRequest('/api/admin/specialists', 'POST', {
        ...data,
        expertise: expertiseArray,
        id: `specialist-${Date.now()}`,
      });
    },
    onSuccess: () => {
      toast({ description: "کارشناس با موفقیت اضافه شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/specialists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/specialists/online'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "خطا در اضافه کردن کارشناس" 
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/specialists/${id}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      toast({ description: "وضعیت کارشناس به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/specialists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/specialists/online'] });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "خطا در به‌روزرسانی وضعیت" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<SpecialistForm> }) => {
      const expertiseArray = data.updates.expertise ? 
        data.updates.expertise.split("،").map(item => item.trim()) : 
        undefined;
      return apiRequest(`/api/admin/specialists/${data.id}`, 'PUT', {
        ...data.updates,
        expertise: expertiseArray,
      });
    },
    onSuccess: () => {
      toast({ description: "کارشناس به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/specialists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/specialists/online'] });
      setIsEditDialogOpen(false);
      setEditingSpecialist(null);
      form.reset();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "خطا در به‌روزرسانی کارشناس" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/specialists/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ description: "کارشناس حذف شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/specialists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/specialists/online'] });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "خطا در حذف کارشناس" 
      });
    },
  });

  const onSubmit = (data: SpecialistForm) => {
    if (editingSpecialist) {
      updateMutation.mutate({ id: editingSpecialist.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditSpecialist = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    form.reset({
      name: specialist.name,
      email: specialist.email,
      phone: specialist.phone || "",
      department: specialist.department,
      status: specialist.status as "online" | "busy" | "away" | "offline",
      expertise: (specialist.expertise || []).join("، "),
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingSpecialist(null);
    form.reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "away": return "bg-orange-500";
      case "offline": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "آنلاین";
      case "busy": return "مشغول";
      case "away": return "غیرحاضر";
      case "offline": return "آفلاین";
      default: return "نامشخص";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت کارشناسان</h1>
          <p className="text-gray-600 mt-2">
            مدیریت کارشناسان پشتیبانی آنلاین و مکاتبات یک ماهه
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              افزودن کارشناس
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingSpecialist ? "ویرایش کارشناس" : "افزودن کارشناس جدید"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام کامل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="نام کارشناس" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ایمیل</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تلفن</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+98..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بخش</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="نام بخش" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب وضعیت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">آنلاین</SelectItem>
                          <SelectItem value="busy">مشغول</SelectItem>
                          <SelectItem value="away">غیرحاضر</SelectItem>
                          <SelectItem value="offline">آفلاین</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تخصص‌ها (با کاما جدا کنید)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="تصفیه آب، کودها، رنگ" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "در حال ذخیره..." : 
                     editingSpecialist ? "به‌روزرسانی" : "ذخیره"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    لغو
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="outline" 
          onClick={cleanupExpiredEntries}
          className="flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          پاکسازی منقضی شده
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="specialists" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            کارشناسان
          </TabsTrigger>
          <TabsTrigger value="correspondence" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            مکاتبات ({correspondenceData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specialists" className="space-y-6">
          <div className="grid gap-6">
            {(specialists as Specialist[]).map((specialist: Specialist) => (
          <Card key={specialist.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Circle className={`w-3 h-3 fill-current ${getStatusColor(specialist.status).replace('bg-', 'text-')}`} />
                      <h3 className="text-lg font-semibold">{specialist.name}</h3>
                    </div>
                    <Badge variant={specialist.status === "online" ? "default" : "secondary"}>
                      {getStatusText(specialist.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{specialist.department}</div>
                    <div className="flex items-center gap-4 mt-2">
                      {specialist.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {specialist.email}
                        </div>
                      )}
                      {specialist.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {specialist.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {(specialist.expertise || []).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={specialist.status}
                    onValueChange={(status) => 
                      updateStatusMutation.mutate({ id: specialist.id, status })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">آنلاین</SelectItem>
                      <SelectItem value="busy">مشغول</SelectItem>
                      <SelectItem value="away">غیرحاضر</SelectItem>
                      <SelectItem value="offline">آفلاین</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSpecialist(specialist)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(specialist.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(specialists as Specialist[]).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                هیچ کارشناسی یافت نشد
              </h3>
              <p className="text-gray-500 mb-4">
                برای شروع، کارشناس جدیدی اضافه کنید
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                افزودن اولین کارشناس
              </Button>
            </CardContent>
          </Card>
        )}
          </div>
        </TabsContent>

        <TabsContent value="correspondence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add new correspondence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  ثبت مکاتبه جدید
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">انتخاب کارشناس</label>
                  <Select value={selectedSpecialist || ""} onValueChange={setSelectedSpecialist}>
                    <SelectTrigger>
                      <SelectValue placeholder="کارشناس را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialists.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.name} - {spec.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">نام مشتری</label>
                    <Input
                      value={newCorrespondence.customerName}
                      onChange={(e) => setNewCorrespondence(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="نام مشتری"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ایمیل مشتری</label>
                    <Input
                      type="email"
                      value={newCorrespondence.customerEmail}
                      onChange={(e) => setNewCorrespondence(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="ایمیل مشتری"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">موضوع</label>
                  <Input
                    value={newCorrespondence.subject}
                    onChange={(e) => setNewCorrespondence(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="موضوع مکاتبه"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">کانال ارتباطی</label>
                    <Select value={newCorrespondence.channel} onValueChange={(value: 'email' | 'chat' | 'phone') => setNewCorrespondence(prev => ({ ...prev, channel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">ایمیل</SelectItem>
                        <SelectItem value="chat">چت آنلاین</SelectItem>
                        <SelectItem value="phone">تلفن</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">نوع پیام</label>
                    <Select value={newCorrespondence.type} onValueChange={(value: 'incoming' | 'outgoing') => setNewCorrespondence(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incoming">دریافتی</SelectItem>
                        <SelectItem value="outgoing">ارسالی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">متن پیام</label>
                  <Textarea
                    value={newCorrespondence.message}
                    onChange={(e) => setNewCorrespondence(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="متن پیام یا مکاتبه..."
                    rows={4}
                  />
                </div>

                <Button onClick={addCorrespondenceEntry} className="w-full">
                  ثبت مکاتبه
                </Button>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  آمار مکاتبات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{correspondenceData.length}</div>
                    <div className="text-sm text-gray-600">کل مکاتبات</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {correspondenceData.filter(c => c.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">فعال</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {correspondenceData.filter(c => c.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-gray-600">حل شده</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {correspondenceData.filter(c => {
                        const expiryDate = new Date(c.expiresAt);
                        const now = new Date();
                        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft <= 7;
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">منقضی در هفته</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">توزیع بر اساس کانال:</h4>
                  {['email', 'chat', 'phone'].map(channel => {
                    const count = correspondenceData.filter(c => c.channel === channel).length;
                    const percentage = correspondenceData.length > 0 ? Math.round((count / correspondenceData.length) * 100) : 0;
                    return (
                      <div key={channel} className="flex items-center justify-between text-sm">
                        <span>{channel === 'email' ? 'ایمیل' : channel === 'chat' ? 'چت' : 'تلفن'}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Correspondence List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                لیست مکاتبات (ذخیره شده برای یک ماه)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {correspondenceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هنوز مکاتبه‌ای ثبت نشده است
                </div>
              ) : (
                <div className="space-y-4">
                  {correspondenceData
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((entry) => {
                      const specialist = specialists.find(s => s.id === entry.specialistId);
                      const expiryDate = new Date(entry.expiresAt);
                      const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                                {entry.status === 'active' ? 'فعال' : 'حل شده'}
                              </Badge>
                              <Badge variant="outline">
                                {entry.channel === 'email' ? 'ایمیل' : entry.channel === 'chat' ? 'چت' : 'تلفن'}
                              </Badge>
                              <Badge variant={entry.type === 'incoming' ? 'destructive' : 'default'}>
                                {entry.type === 'incoming' ? 'دریافتی' : 'ارسالی'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {daysLeft > 0 ? `${daysLeft} روز باقی مانده` : 'منقضی شده'}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCorrespondenceStatus(entry.id, entry.status === 'active' ? 'resolved' : 'active')}
                              >
                                {entry.status === 'active' ? 'حل شد' : 'فعال کن'}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">{specialist?.name || 'نامشخص'}</span>
                              <span>{entry.customerName}</span>
                              {entry.customerEmail && <span className="text-blue-600">{entry.customerEmail}</span>}
                            </div>
                            
                            {entry.subject && (
                              <div className="font-medium text-gray-900">{entry.subject}</div>
                            )}
                            
                            <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                              {entry.message}
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString('fa-IR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}