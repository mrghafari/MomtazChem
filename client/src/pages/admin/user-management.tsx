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
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Key,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff,
  Crown,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface AdminRole {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  permissionCount?: number;
}

interface AdminPermission {
  id: number;
  name: string;
  displayName: string;
  description: string;
  module: string;
  isActive: boolean;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  roleId: number | null;
  roleName?: string;
  roleDisplayName?: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const createUserSchema = z.object({
  username: z.string().min(3, "نام کاربری باید حداقل 3 کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل 6 کاراکتر باشد"),
  roleId: z.string().min(1, "نقش را انتخاب کنید"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("users");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  // Fetch admin users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch admin roles
  const { data: roles, isLoading: rolesLoading } = useQuery<AdminRole[]>({
    queryKey: ["/api/admin/roles"],
  });

  // Fetch admin permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<AdminPermission[]>({
    queryKey: ["/api/admin/permissions"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => apiRequest("/api/admin/users", "POST", data),
    onSuccess: () => {
      toast({
        title: "کاربر ایجاد شد",
        description: "کاربر جدید با موفقیت ایجاد شد",
      });
      refetchUsers();
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد کاربر",
        description: "مشکلی در ایجاد کاربر رخ داده است",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserForm> }) => 
      apiRequest(`/api/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: "کاربر بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد",
      });
      refetchUsers();
      setEditingUser(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در بروزرسانی",
        description: "مشکلی در بروزرسانی کاربر رخ داده است",
      });
    },
  });

  // Toggle user status
  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest(`/api/admin/users/${id}/status`, "PUT", { isActive }),
    onSuccess: () => {
      refetchUsers();
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    const formData = {
      ...data,
      roleId: parseInt(data.roleId),
    };

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: formData as any });
    } else {
      createUserMutation.mutate(formData as any);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      password: "",
      roleId: user.roleId?.toString() || "",
    });
    setDialogOpen(true);
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'products_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'crm_admin':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shop_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'analytics_admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'content_admin':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionModuleColor = (module: string) => {
    switch (module) {
      case 'users':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'products':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'crm':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'shop':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'analytics':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'content':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'system':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
        <h1 className="text-2xl font-bold">مدیریت کاربران و دسترسی‌ها</h1>
        <Badge variant="destructive" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          فقط سوپر ادمین
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">کاربران ادمین</TabsTrigger>
          <TabsTrigger value="roles">نقش‌ها</TabsTrigger>
          <TabsTrigger value="permissions">مجوزها</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  کاربران ادمین
                </CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      افزودن کاربر
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کاربری</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input type="email" {...field} />
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
                                {editingUser ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
                              </FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="roleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نقش</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="نقش را انتخاب کنید" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roles?.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            انصراف
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending || updateUserMutation.isPending}
                          >
                            {editingUser ? 'بروزرسانی' : 'ایجاد'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>آخرین ورود</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.roleDisplayName ? (
                            <Badge className={getRoleBadgeColor(user.roleName || '')}>
                              {user.roleDisplayName}
                            </Badge>
                          ) : (
                            <Badge variant="outline">بدون نقش</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) =>
                                toggleUserStatusMutation.mutate({
                                  id: user.id,
                                  isActive: checked,
                                })
                              }
                            />
                            <span className="text-sm">
                              {user.isActive ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString('fa-IR')
                            : 'هرگز'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                نقش‌های ادمین
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles?.map((role) => (
                    <Card key={role.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getRoleBadgeColor(role.name)}>
                            {role.displayName}
                          </Badge>
                          <Badge variant="outline">
                            {role.permissionCount || 0} مجوز
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {role.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Switch checked={role.isActive} disabled />
                          <span className="text-sm">
                            {role.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                مجوزهای سیستم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="space-y-6">
                  {['users', 'products', 'crm', 'shop', 'analytics', 'content', 'system'].map((module) => {
                    const modulePermissions = permissions?.filter(p => p.module === module) || [];
                    if (modulePermissions.length === 0) return null;

                    return (
                      <div key={module} className="space-y-3">
                        <h3 className="text-lg font-semibold">
                          ماژول {module === 'users' ? 'کاربران' : 
                                 module === 'products' ? 'محصولات' :
                                 module === 'crm' ? 'CRM' :
                                 module === 'shop' ? 'فروشگاه' :
                                 module === 'analytics' ? 'گزارش‌گیری' :
                                 module === 'content' ? 'محتوا' :
                                 module === 'system' ? 'سیستم' : module}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {modulePermissions.map((permission) => (
                            <Card key={permission.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={getPermissionModuleColor(permission.module)}>
                                    {permission.module}
                                  </Badge>
                                  <Switch checked={permission.isActive} disabled />
                                </div>
                                <h4 className="font-medium text-sm mb-1">
                                  {permission.displayName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
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