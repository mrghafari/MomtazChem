import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Shield, Plus, Edit, Trash2, DollarSign, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createUserSchema = z.object({
  username: z.string().min(3, "نام کاربری باید حداقل 3 کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل 6 کاراکتر باشد"),
  department: z.enum(["financial", "warehouse", "logistics"], {
    required_error: "انتخاب بخش الزامی است"
  }),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface DepartmentUser {
  id: number;
  username: string;
  email: string;
  department: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function SuperAdminDepartmentManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DepartmentUser | null>(null);
  const { toast } = useToast();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      department: "financial"
    }
  });

  // Fetch department users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/department-users"],
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const endpoint = editingUser 
        ? `/api/super-admin/department-users/${editingUser.id}`
        : "/api/super-admin/department-users";
      
      return apiRequest(endpoint, {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/department-users"] });
      setDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: "موفق",
        description: editingUser ? "کاربر بروزرسانی شد" : "کاربر جدید ایجاد شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در عملیات",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/super-admin/department-users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/department-users"] });
      toast({
        title: "موفق",
        description: "کاربر حذف شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در حذف کاربر",
        variant: "destructive",
      });
    }
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest(`/api/super-admin/department-users/${userId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/department-users"] });
      toast({
        title: "موفق",
        description: "وضعیت کاربر تغییر کرد",
      });
    }
  });

  const handleSubmit = (data: CreateUserFormData) => {
    userMutation.mutate(data);
  };

  const openEditDialog = (user: DepartmentUser) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      password: "",
      department: user.department as "financial" | "warehouse" | "logistics"
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset();
    setDialogOpen(true);
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'financial':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'warehouse':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'logistics':
        return <Truck className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getDepartmentName = (department: string) => {
    switch (department) {
      case 'financial':
        return 'بخش مالی';
      case 'warehouse':
        return 'بخش انبار';
      case 'logistics':
        return 'بخش لجستیک';
      default:
        return department;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'financial':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warehouse':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'logistics':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              مدیریت کاربران بخش‌ها
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              مدیریت دسترسی کاربران بخش‌های مالی، انبار و لجستیک
            </p>
          </div>
          
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            افزودن کاربر جدید
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">بخش مالی</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: DepartmentUser) => u.department === 'financial').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">بخش انبار</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: DepartmentUser) => u.department === 'warehouse').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">بخش لجستیک</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: DepartmentUser) => u.department === 'logistics').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">هیچ کاربری تعریف نشده</h3>
              <p className="text-gray-500">برای شروع، کاربر جدید اضافه کنید</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user: DepartmentUser) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          {getDepartmentIcon(user.department)}
                          <span className="font-semibold text-lg">{user.username}</span>
                        </div>
                        
                        <Badge className={getDepartmentColor(user.department)}>
                          {getDepartmentName(user.department)}
                        </Badge>
                        
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات کاربری</h4>
                          <p className="text-sm text-gray-600">ایمیل: {user.email}</p>
                          <p className="text-sm text-gray-600">
                            تاریخ ایجاد: {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">آخرین ورود</h4>
                          <p className="text-sm text-gray-600">
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'هرگز وارد نشده'
                            }
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">دسترسی</h4>
                          <p className="text-sm text-gray-600">
                            فقط {getDepartmentName(user.department)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        ویرایش
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ 
                          userId: user.id, 
                          isActive: !user.isActive 
                        })}
                        className={user.isActive 
                          ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
                          : "border-green-300 text-green-600 hover:bg-green-50"
                        }
                      >
                        {user.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(user.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام کاربری</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="نام کاربری" />
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
                        <Input {...field} type="email" placeholder="ایمیل" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editingUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="رمز عبور" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب بخش" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="financial">بخش مالی</SelectItem>
                          <SelectItem value="warehouse">بخش انبار</SelectItem>
                          <SelectItem value="logistics">بخش لجستیک</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={userMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {userMutation.isPending ? "در حال پردازش..." : 
                     editingUser ? "بروزرسانی" : "ایجاد کاربر"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}