import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Users, 
  MessageSquare, 
  Archive, 
  Calendar, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone 
} from "lucide-react";
import * as z from "zod";

// Types
interface Specialist {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  status?: string;
  expertise?: string[];
  isActive?: boolean;
  lastActive?: string;
  workingHours?: string | {
    start: string;
    end: string;
    days?: string[];
  };
  bio?: string;
}

interface CorrespondenceEntry {
  id: string;
  specialistId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  channel: 'email' | 'chat' | 'phone';
  type: 'incoming' | 'outgoing';
  status: 'active' | 'resolved';
  createdAt: string;
  expiresAt: string;
}

// Form schemas
const specialistSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  department: z.string().min(1, "بخش الزامی است"),
  phone: z.string().optional(),
  status: z.string().optional(),
  expertise: z.string().optional(),
  bio: z.string().optional(),
  workingHours: z.string().optional(),
});

type SpecialistForm = z.infer<typeof specialistSchema>;

export default function SpecialistsAdmin() {
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("specialists");
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [correspondenceData, setCorrespondenceData] = useState<CorrespondenceEntry[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newCorrespondence, setNewCorrespondence] = useState<{
    customerName: string;
    customerPhone: string;
    subject: string;
    message: string;
    channel: 'email' | 'chat' | 'phone';
    type: 'incoming' | 'outgoing';
  }>({
    customerName: '',
    customerPhone: '',
    subject: '',
    message: '',
    channel: 'email',
    type: 'incoming'
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

  // Search correspondence by phone number (Database API implementation)
  const searchCorrespondence = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً شماره تلفن را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/correspondence/search?phone=${encodeURIComponent(customerPhone)}`);
      if (!response.ok) {
        throw new Error('Failed to search correspondence');
      }
      
      const phoneResults = await response.json();
      setSearchResults(phoneResults);
      
      toast({
        title: "جستجو کامل شد",
        description: `${phoneResults.length} مورد مکاتبه برای این شماره تلفن یافت شد`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطا در جستجو",
        description: "خطا در جستجوی مکاتبات",
        variant: "destructive"
      });
    }
  };

  // Add new correspondence entry (localStorage implementation)
  const addCorrespondenceEntry = () => {
    if (!selectedSpecialist || !newCorrespondence.customerName || !newCorrespondence.customerPhone || !newCorrespondence.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const selectedSpec = specialists.find(s => s.id === selectedSpecialist);
    if (!selectedSpec) {
      toast({
        title: "Error",
        description: "Please select a valid specialist",
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
      customerPhone: newCorrespondence.customerPhone,
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
      customerPhone: '',
      subject: '',
      message: '',
      channel: 'email',
      type: 'incoming'
    });

    toast({
      title: "Success",
      description: "Correspondence added successfully",
    });
  };

  // Update correspondence status
  const updateCorrespondenceStatus = (id: string, status: 'active' | 'resolved') => {
    const updatedData = correspondenceData.map(entry =>
      entry.id === id ? { ...entry, status } : entry
    );
    saveCorrespondence(updatedData);
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
      department: "",
      phone: "",
      status: "online",
      expertise: "",
      bio: "",
      workingHours: "9:00 - 17:00",
    },
  });

  const createSpecialistMutation = useMutation({
    mutationFn: async (data: SpecialistForm) => {
      console.log('Creating specialist with data:', data);
      const response = await fetch('/api/admin/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          expertise: data.expertise ? data.expertise.split(',').map(s => s.trim()) : []
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Specialist creation failed:', response.status, errorData);
        throw new Error(`Failed to create specialist: ${response.status} ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت اضافه شد",
      });
    },
    onError: (error) => {
      console.error('Specialist creation error:', error);
      toast({
        title: "خطا",
        description: `خطا در اضافه کردن کارشناس: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateSpecialistMutation = useMutation({
    mutationFn: async (data: SpecialistForm & { id: string }) => {
      const response = await fetch(`/api/admin/specialists/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          expertise: data.expertise ? data.expertise.split(',').map(s => s.trim()) : []
        }),
      });
      if (!response.ok) throw new Error('Failed to update specialist');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsEditDialogOpen(false);
      setEditingSpecialist(null);
      form.reset();
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی کارشناس",
        variant: "destructive",
      });
    },
  });

  const deleteSpecialistMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/specialists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete specialist');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت حذف شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در حذف کارشناس",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SpecialistForm) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Is editing?', !!editingSpecialist);
    
    if (editingSpecialist) {
      console.log('Updating specialist:', editingSpecialist.id);
      updateSpecialistMutation.mutate({ ...data, id: editingSpecialist.id });
    } else {
      console.log('Creating new specialist');
      createSpecialistMutation.mutate(data);
    }
  };

  const handleEdit = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    
    // Convert workingHours to string format for the form
    const workingHoursString = typeof specialist.workingHours === 'string' 
      ? specialist.workingHours 
      : typeof specialist.workingHours === 'object' && specialist.workingHours !== null
        ? `${(specialist.workingHours as any).start || '08:00'} - ${(specialist.workingHours as any).end || '17:00'}`
        : "08:00 - 17:00";
    
    form.reset({
      name: specialist.name,
      email: specialist.email,
      department: specialist.department,
      phone: specialist.phone || "",
      status: specialist.status || "online",
      expertise: specialist.expertise?.join(', ') || "",
      bio: specialist.bio || "",
      workingHours: workingHoursString,
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingSpecialist(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">در حال بارگذاری...</div>
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
        
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              console.log('Testing direct API call...');
              try {
                const response = await fetch('/api/admin/specialists', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    name: "تست مستقیم",
                    email: `test${Date.now()}@example.com`,
                    department: "فنی",
                    phone: "09123456789",
                    expertise: ["تست"]
                  }),
                });
                
                console.log('Response status:', response.status);
                const result = await response.text();
                console.log('Response text:', result);
                
                if (response.ok) {
                  toast({
                    title: "موفق",
                    description: "تست مستقیم API موفق بود!",
                  });
                  refetch();
                } else {
                  toast({
                    title: "خطا",
                    description: `تست API ناموفق: ${result}`,
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Direct API test error:', error);
                toast({
                  title: "خطا",
                  description: `خطای شبکه: ${error}`,
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            size="sm"
          >
            تست API
          </Button>
          
          <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                افزودن کارشناس
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSpecialist ? "ویرایش کارشناس" : "افزودن کارشناس جدید"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام</FormLabel>
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
                          <Input {...field} type="email" placeholder="ایمیل کارشناس" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>بخش</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب بخش" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">فنی</SelectItem>
                              <SelectItem value="sales">فروش</SelectItem>
                              <SelectItem value="customer-service">خدمات مشتری</SelectItem>
                              <SelectItem value="logistics">لجستیک</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Input {...field} placeholder="شماره تلفن" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تخصص‌ها (با کاما جدا کنید)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: تصفیه آب، مواد شیمیایی صنعتی" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="08:00 - 17:00, Monday-Friday" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Brief description about the specialist" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={createSpecialistMutation.isPending || updateSpecialistMutation.isPending}>
                    {editingSpecialist ? "به‌روزرسانی" : "افزودن"}
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="specialists" className="flex items-center gap-2 text-lg py-3">
            <Users className="w-5 h-5" />
            Specialists Management
          </TabsTrigger>
          <TabsTrigger value="correspondence" className="flex items-center gap-2 text-lg py-3 bg-blue-50 data-[state=active]:bg-blue-100">
            <MessageSquare className="w-5 h-5" />
            Chats & Correspondence ({correspondenceData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specialists" className="space-y-6">
          <div className="grid gap-6">
            {specialists && specialists.length > 0 ? specialists.map((specialist: Specialist) => (
              <Card key={specialist.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{specialist.name}</h3>
                        <Badge variant={specialist.isActive ? "default" : "secondary"}>
                          {specialist.isActive ? "آنلاین" : "آفلاین"}
                        </Badge>
                        <Badge variant="outline">{specialist.department}</Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{specialist.email}</span>
                        </div>
                        {specialist.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{specialist.phone}</span>
                          </div>
                        )}
                        {specialist.workingHours && (
                          <div className="text-sm">
                            <strong>Working Hours:</strong> {
                              typeof specialist.workingHours === 'string' 
                                ? specialist.workingHours 
                                : typeof specialist.workingHours === 'object' && specialist.workingHours !== null
                                  ? `${(specialist.workingHours as any).start || '08:00'} - ${(specialist.workingHours as any).end || '17:00'}`
                                  : 'Not specified'
                            }
                          </div>
                        )}
                      </div>

                      {specialist.expertise && Array.isArray(specialist.expertise) && specialist.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {specialist.expertise.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {typeof skill === 'string' ? skill : String(skill)}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {specialist.bio && (
                        <p className="text-sm text-gray-700 mt-2">{specialist.bio}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(specialist)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSpecialistMutation.mutate(specialist.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    هنوز کارشناسی اضافه نشده
                  </h3>
                  <p className="text-gray-600 mb-4">
                    برای شروع، اولین کارشناس خود را اضافه کنید
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
          <div className="grid grid-cols-1 gap-6">
            {/* Phone Number Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Monthly Correspondence Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Phone Number</label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1234567890"
                      type="tel"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={searchCorrespondence} className="w-full">
                      Search Last Month Records
                    </Button>
                  </div>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Found {searchResults.length} correspondence entries:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((item: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p><strong>Subject:</strong> {item.subject}</p>
                              <p><strong>Customer:</strong> {item.customerName}</p>
                              <p><strong>Specialist:</strong> {item.specialistName}</p>
                              <p><strong>Channel:</strong> {item.channel}</p>
                              <p className="text-gray-600 mt-1">{item.message}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add new correspondence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Correspondence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Specialist</label>
                  <Select value={selectedSpecialist || ""} onValueChange={setSelectedSpecialist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a specialist" />
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
                    <label className="block text-sm font-medium mb-2">Customer Name</label>
                    <Input
                      value={newCorrespondence.customerName}
                      onChange={(e) => setNewCorrespondence(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Phone</label>
                    <Input
                      type="tel"
                      value={newCorrespondence.customerPhone}
                      onChange={(e) => setNewCorrespondence(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Customer phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={newCorrespondence.subject}
                    onChange={(e) => setNewCorrespondence(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Correspondence subject"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Communication Channel</label>
                    <Select 
                      value={newCorrespondence.channel} 
                      onValueChange={(value: 'email' | 'chat' | 'phone') => 
                        setNewCorrespondence(prev => ({ ...prev, channel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="chat">Live Chat</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message Type</label>
                    <Select 
                      value={newCorrespondence.type} 
                      onValueChange={(value: 'incoming' | 'outgoing') => 
                        setNewCorrespondence(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incoming">Incoming</SelectItem>
                        <SelectItem value="outgoing">Outgoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message Content</label>
                  <Textarea
                    value={newCorrespondence.message}
                    onChange={(e) => setNewCorrespondence(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Message content or correspondence..."
                    rows={4}
                  />
                </div>

                <Button onClick={addCorrespondenceEntry} className="w-full">
                  Submit Correspondence
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
                              <span className="font-medium">{specialist?.name || 'Unknown'}</span>
                              <span>{entry.customerName}</span>
                              {entry.customerPhone && <span className="text-blue-600">{entry.customerPhone}</span>}
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