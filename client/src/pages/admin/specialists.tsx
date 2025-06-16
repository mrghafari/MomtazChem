import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Clock
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

export default function SpecialistsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: specialists = [], isLoading, refetch } = useQuery<Specialist[]>({
    queryKey: ['/api/admin/specialists'],
  });

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
            مدیریت کارشناسان پشتیبانی آنلاین و وضعیت آن‌ها
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
      </div>

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
    </div>
  );
}