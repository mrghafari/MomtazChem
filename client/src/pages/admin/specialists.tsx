import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Briefcase,
  Clock,
  Settings,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Specialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: "online" | "busy" | "away" | "offline";
  expertise: string[];
  isActive: boolean;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  createdAt: string;
}

const SpecialistsAdmin = () => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Specialist>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const departments = [
    "فروش محصولات شیمیایی",
    "پشتیبانی فنی", 
    "فروش رنگ و تینر",
    "فروش کودهای کشاورزی",
    "مشاوره تخصصی",
    "خدمات مشتریان"
  ];

  const expertiseAreas = [
    "افزودنی‌های سوخت",
    "تصفیه آب",
    "محصولات رنگ",
    "حلال‌ها",
    "کودهای کشاورزی",
    "مشاوره فنی",
    "کنترل کیفیت",
    "تحلیل شیمیایی"
  ];

  const workingDays = [
    { value: "saturday", label: "شنبه" },
    { value: "sunday", label: "یکشنبه" },
    { value: "monday", label: "دوشنبه" },
    { value: "tuesday", label: "سه‌شنبه" },
    { value: "wednesday", label: "چهارشنبه" },
    { value: "thursday", label: "پنج‌شنبه" },
    { value: "friday", label: "جمعه" }
  ];

  // Fetch specialists
  const { data: specialists = [], isLoading, error } = useQuery<Specialist[]>({
    queryKey: ["/api/admin/specialists"],
    retry: false
  });

  // Create specialist mutation
  const createSpecialistMutation = useMutation({
    mutationFn: async (data: Partial<Specialist>) => {
      const response = await fetch("/api/admin/specialists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialists"] });
      setIsCreateDialogOpen(false);
      setEditForm({});
      toast({
        title: "موفق",
        description: "کارشناس جدید با موفقیت اضافه شد"
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در افزودن کارشناس",
        variant: "destructive"
      });
    }
  });

  // Update specialist mutation
  const updateSpecialistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Specialist> }) => {
      const response = await fetch(`/api/admin/specialists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialists"] });
      setIsEditDialogOpen(false);
      setSelectedSpecialist(null);
      setEditForm({});
      toast({
        title: "موفق",
        description: "اطلاعات کارشناس به‌روزرسانی شد"
      });
    },
    onError: () => {
      toast({
        title: "خطا", 
        description: "خطا در به‌روزرسانی اطلاعات",
        variant: "destructive"
      });
    }
  });

  // Delete specialist mutation
  const deleteSpecialistMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/specialists/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialists"] });
      toast({
        title: "موفق",
        description: "کارشناس حذف شد"
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف کارشناس",
        variant: "destructive"
      });
    }
  });

  const handleCreateSpecialist = () => {
    if (!editForm.name || !editForm.email || !editForm.department) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    createSpecialistMutation.mutate({
      ...editForm,
      id: Date.now().toString(),
      status: "offline",
      isActive: true,
      expertise: editForm.expertise || [],
      workingHours: editForm.workingHours || {
        start: "08:00",
        end: "17:00", 
        days: ["saturday", "sunday", "monday", "tuesday", "wednesday"]
      },
      createdAt: new Date().toISOString()
    });
  };

  const handleUpdateSpecialist = () => {
    if (!selectedSpecialist || !editForm.name || !editForm.email) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    updateSpecialistMutation.mutate({
      id: selectedSpecialist.id,
      data: editForm
    });
  };

  const openEditDialog = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setEditForm(specialist);
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditForm({
      name: "",
      email: "",
      phone: "",
      department: "",
      expertise: [],
      workingHours: {
        start: "08:00",
        end: "17:00",
        days: ["saturday", "sunday", "monday", "tuesday", "wednesday"]
      }
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "away": return "bg-gray-100 text-gray-800";
      case "offline": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">خطا در بارگذاری</h2>
          <p className="text-gray-600">امکان دریافت اطلاعات کارشناسان وجود ندارد.</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              مدیریت کارشناسان آنلاین
            </h1>
            <p className="text-gray-600 mt-2">مدیریت و تخصیص کارشناسان پشتیبانی آنلاین</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            افزودن کارشناس جدید
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">کل کارشناسان</p>
                  <p className="text-2xl font-bold text-gray-900">{specialists?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">آنلاین</p>
                  <p className="text-2xl font-bold text-green-600">
                    {specialists?.filter(s => s.status === "online").length || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">مشغول</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {specialists?.filter(s => s.status === "busy").length || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">آفلاین</p>
                  <p className="text-2xl font-bold text-red-600">
                    {specialists?.filter(s => s.status === "offline").length || 0}
                  </p>
                </div>
                <X className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Specialists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists?.map((specialist) => (
            <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    {specialist.name}
                  </CardTitle>
                  <Badge className={getStatusColor(specialist.status)}>
                    {getStatusText(specialist.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {specialist.email}
                  </div>
                  {specialist.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {specialist.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {specialist.department}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {specialist.workingHours?.start} - {specialist.workingHours?.end}
                  </div>
                </div>

                {specialist.expertise && specialist.expertise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">تخصص‌ها:</p>
                    <div className="flex flex-wrap gap-1">
                      {specialist.expertise.map((exp, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(specialist)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    ویرایش
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSpecialistMutation.mutate(specialist.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {specialists.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">هنوز کارشناسی ثبت نشده</h3>
              <p className="text-gray-500 mb-4">اولین کارشناس خود را اضافه کنید</p>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                افزودن کارشناس
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedSpecialist(null);
            setEditForm({});
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCreateDialogOpen ? "افزودن کارشناس جدید" : "ویرایش کارشناس"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">نام و نام خانوادگی *</Label>
                  <Input
                    id="name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="نام کامل کارشناس"
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="09123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="department">بخش *</Label>
                  <Select
                    value={editForm.department || ""}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب بخش" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expertise Areas */}
              <div>
                <Label>حوزه‌های تخصصی</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {expertiseAreas.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={area}
                        checked={editForm.expertise?.includes(area) || false}
                        onChange={(e) => {
                          const currentExpertise = editForm.expertise || [];
                          if (e.target.checked) {
                            setEditForm(prev => ({
                              ...prev,
                              expertise: [...currentExpertise, area]
                            }));
                          } else {
                            setEditForm(prev => ({
                              ...prev,
                              expertise: currentExpertise.filter(exp => exp !== area)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={area} className="text-sm">{area}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <Label>ساعات کاری</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="startTime" className="text-sm">ساعت شروع</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={editForm.workingHours?.start || "08:00"}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          start: e.target.value,
                          end: prev.workingHours?.end || "17:00",
                          days: prev.workingHours?.days || []
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm">ساعت پایان</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editForm.workingHours?.end || "17:00"}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          start: prev.workingHours?.start || "08:00",
                          end: e.target.value,
                          days: prev.workingHours?.days || []
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-sm">روزهای کاری</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {workingDays.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day.value}
                          checked={editForm.workingHours?.days?.includes(day.value) || false}
                          onChange={(e) => {
                            const currentDays = editForm.workingHours?.days || [];
                            const newDays = e.target.checked
                              ? [...currentDays, day.value]
                              : currentDays.filter(d => d !== day.value);
                            
                            setEditForm(prev => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                start: prev.workingHours?.start || "08:00",
                                end: prev.workingHours?.end || "17:00",
                                days: newDays
                              }
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={day.value} className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status (for edit only) */}
              {isEditDialogOpen && (
                <div>
                  <Label htmlFor="status">وضعیت</Label>
                  <Select
                    value={editForm.status || "offline"}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">آنلاین</SelectItem>
                      <SelectItem value="busy">مشغول</SelectItem>
                      <SelectItem value="away">غیرحاضر</SelectItem>
                      <SelectItem value="offline">آفلاین</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setSelectedSpecialist(null);
                    setEditForm({});
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  انصراف
                </Button>
                <Button
                  onClick={isCreateDialogOpen ? handleCreateSpecialist : handleUpdateSpecialist}
                  disabled={createSpecialistMutation.isPending || updateSpecialistMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isCreateDialogOpen ? "ایجاد کارشناس" : "ذخیره تغییرات"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SpecialistsAdmin;