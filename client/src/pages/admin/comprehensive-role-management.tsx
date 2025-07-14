import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Shield, 
  Key,
  ArrowLeft,
  Crown,
  Globe,
  Plus,
  Trash2,
  Settings,
  UserCog,
  Save,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
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
  assigned?: boolean;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  roleId?: number;
  roleName?: string;
  roleDisplayName?: string;
  lastLoginAt?: string;
}

// Form schemas
const userFormSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد").optional(),
  roleId: z.number().min(1, "انتخاب نقش الزامی است"),
});

const roleFormSchema = z.object({
  name: z.string().min(1, "نام نقش الزامی است"),
  displayName: z.string().min(1, "نام نمایشی الزامی است"),
  description: z.string().optional(),
});

export default function ComprehensiveRoleManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State management
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Forms
  const userForm = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      roleId: 0,
    },
  });

  const roleForm = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
    },
  });

  // Data fetching
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['/api/admin/roles'],
  });

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['/api/admin/permissions'],
  });

  const { data: rolePermissions = [], isLoading: loadingRolePermissions } = useQuery({
    queryKey: ['/api/admin/roles', selectedRole?.id, 'permissions'],
    enabled: !!selectedRole?.id,
  });

  // Mutations for users
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/users', { method: 'POST', body: data });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "کاربر با موفقیت ایجاد شد" });
      setIsUserDialogOpen(false);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در ایجاد کاربر",
        variant: "destructive" 
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "کاربر با موفقیت به‌روزرسانی شد" });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در به‌روزرسانی کاربر",
        variant: "destructive" 
      });
    }
  });

  // Mutations for roles
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/roles', { method: 'POST', body: data });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "نقش با موفقیت ایجاد شد" });
      setIsRoleDialogOpen(false);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در ایجاد نقش",
        variant: "destructive" 
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest(`/api/admin/roles/${id}`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "نقش با موفقیت به‌روزرسانی شد" });
      setIsRoleDialogOpen(false);
      setSelectedRole(null);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در به‌روزرسانی نقش",
        variant: "destructive" 
      });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/roles/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "نقش با موفقیت حذف شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در حذف نقش",
        variant: "destructive" 
      });
    }
  });

  // Permission management
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number, permissionIds: number[] }) => {
      return await apiRequest(`/api/admin/roles/${roleId}/permissions`, { 
        method: 'PUT', 
        body: { permissionIds } 
      });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "دسترسی‌های نقش با موفقیت به‌روزرسانی شد" });
      setIsPermissionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles', selectedRole?.id, 'permissions'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در به‌روزرسانی دسترسی‌ها",
        variant: "destructive" 
      });
    }
  });

  // Role assignment
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number, roleId: number }) => {
      return await apiRequest(`/api/admin/users/${userId}/role`, { 
        method: 'PUT', 
        body: { roleId } 
      });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "نقش با موفقیت به کاربر تخصیص یافت" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در تخصیص نقش",
        variant: "destructive" 
      });
    }
  });

  // Event handlers
  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    userForm.reset({
      username: user.username,
      email: user.email,
      password: "",
      roleId: user.roleId || 0,
    });
    setIsUserDialogOpen(true);
  };

  const handleEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    roleForm.reset({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
    });
    setIsRoleDialogOpen(true);
  };

  const handleManagePermissions = (role: AdminRole) => {
    setSelectedRole(role);
    setIsPermissionDialogOpen(true);
    // Load current permissions for this role
    const currentPermissions = rolePermissions
      .filter((p: AdminPermission) => p.assigned)
      .map((p: AdminPermission) => p.id);
    setSelectedPermissions(currentPermissions);
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleUserSubmit = (data: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleRoleSubmit = (data: any) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleAssignRole = (userId: number, roleId: number) => {
    assignRoleMutation.mutate({ userId, roleId });
  };

  const groupedPermissions = permissions.reduce((groups: any, permission: AdminPermission) => {
    const module = permission.module;
    if (!groups[module]) {
      groups[module] = [];
    }
    groups[module].push(permission);
    return groups;
  }, {});

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت به داشبورد
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              مدیریت کامل نقش‌ها و دسترسی‌ها
            </h1>
            <p className="text-muted-foreground mt-2">
              ایجاد نقش‌های سفارشی، تخصیص کاربران و تنظیم دسترسی‌های ماژولی
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Crown className="h-3 w-3 mr-1" />
          فقط سوپر ادمین
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            مدیریت کاربران
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            مدیریت نقش‌ها
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            مشاهده دسترسی‌ها
          </TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                کاربران ادمین ({users.length})
              </CardTitle>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSelectedUser(null); userForm.reset(); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    افزودن کاربر
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
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
                        control={userForm.control}
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
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {selectedUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نقش</FormLabel>
                            <Select 
                              value={field.value?.toString()} 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب نقش" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role: AdminRole) => (
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
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending || updateUserMutation.isPending}
                        >
                          {selectedUser ? "به‌روزرسانی" : "ایجاد"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsUserDialogOpen(false)}
                        >
                          انصراف
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>آخرین ورود</TableHead>
                      <TableHead className="text-left">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: AdminUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={user.roleId?.toString() || ""} 
                              onValueChange={(value) => handleAssignRole(user.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="انتخاب نقش">
                                  {user.roleDisplayName || "بدون نقش"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role: AdminRole) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('fa-IR') : "هرگز"}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Management Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                نقش‌های ادمین ({roles.length})
              </CardTitle>
              <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSelectedRole(null); roleForm.reset(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    ایجاد نقش
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedRole ? "ویرایش نقش" : "ایجاد نقش جدید"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...roleForm}>
                    <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
                      <FormField
                        control={roleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام نقش (انگلیسی)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="custom_manager" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام نمایشی</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="مدیر سفارشی" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>توضیحات</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="توضیح مسئولیت‌های این نقش" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                        >
                          {selectedRole ? "به‌روزرسانی" : "ایجاد"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsRoleDialogOpen(false)}
                        >
                          انصراف
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingRoles ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid gap-4">
                  {roles.map((role: AdminRole) => (
                    <Card key={role.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{role.displayName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {role.permissionCount || 0} دسترسی
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {role.description || "بدون توضیحات"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManagePermissions(role)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            مدیریت دسترسی‌ها
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {role.name !== 'super_admin' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteRoleMutation.mutate(role.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                تمام دسترسی‌های سیستم ({permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPermissions ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid gap-6">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]: [string, any]) => (
                    <Card key={module} className="p-4">
                      <h3 className="font-semibold mb-3 text-lg capitalize">{module}</h3>
                      <div className="grid gap-2">
                        {modulePermissions.map((permission: AdminPermission) => (
                          <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{permission.displayName}</div>
                              <div className="text-sm text-muted-foreground">{permission.description}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {permission.name}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Management Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              مدیریت دسترسی‌های نقش: {selectedRole?.displayName}
            </DialogTitle>
          </DialogHeader>
          
          {loadingRolePermissions ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]: [string, any]) => (
                <Card key={module} className="p-4">
                  <h3 className="font-semibold mb-3 text-lg capitalize">{module}</h3>
                  <div className="grid gap-3">
                    {modulePermissions.map((permission: AdminPermission) => {
                      const rolePermission = rolePermissions.find((rp: AdminPermission) => rp.id === permission.id);
                      const isAssigned = selectedPermissions.includes(permission.id);
                      
                      return (
                        <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={isAssigned}
                            onCheckedChange={(checked) => 
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.displayName}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    if (selectedRole) {
                      updatePermissionsMutation.mutate({
                        roleId: selectedRole.id,
                        permissionIds: selectedPermissions
                      });
                    }
                  }}
                  disabled={updatePermissionsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  ذخیره دسترسی‌ها
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsPermissionDialogOpen(false)}
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}