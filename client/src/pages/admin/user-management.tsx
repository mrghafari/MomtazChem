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
import { 
  Users, 
  UserPlus, 
  Edit, 
  Shield, 
  Key,
  ArrowLeft,
  Crown,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Translations
const translations = {
  en: {
    title: "User and Access Management",
    subtitle: "Manage user accounts and access permissions",
    superAdminOnly: "Super Admin Only",
    backToDashboard: "Back to Dashboard",
    adminUsers: "Admin Users",
    roles: "Roles",
    permissions: "Permissions",
    addUser: "Add User",
    editUser: "Edit User",
    addNewUser: "Add New User",
    username: "Username",
    email: "Email",
    password: "Password",
    newPasswordOptional: "New Password (Optional)",
    role: "Role",
    selectRole: "Select role",
    cancel: "Cancel",
    create: "Create",
    update: "Update",
    user: "User",
    status: "Status",
    lastLogin: "Last Login",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    never: "Never",
    noRole: "No Role",
    loading: "Loading...",
    userCreated: "User Created",
    userCreatedSuccess: "New user created successfully",
    userUpdated: "User Updated",
    userUpdatedSuccess: "Changes saved successfully",
    createUserError: "Error Creating User",
    createUserErrorMessage: "There was a problem creating the user",
    updateUserError: "Error Updating",
    updateUserErrorMessage: "There was a problem updating the user",
    adminRoles: "Admin Roles",
    roleName: "Role Name",
    description: "Description",
    permissionCount: "Permission Count",
    adminPermissions: "Admin Permissions",
    permission: "Permission",
    module: "Module",
    users: "users",
    products: "products",
    crm: "crm",
    shop: "shop",
    analytics: "analytics",
    content: "content",
    system: "system"
  },
  ar: {
    title: "إدارة المستخدمين والصلاحيات",
    subtitle: "إدارة حسابات المستخدمين وصلاحيات الوصول",
    superAdminOnly: "للمدير العام فقط",
    backToDashboard: "العودة إلى لوحة التحكم",
    adminUsers: "مستخدمو الإدارة",
    roles: "الأدوار",
    permissions: "الصلاحيات",
    addUser: "إضافة مستخدم",
    editUser: "تعديل المستخدم",
    addNewUser: "إضافة مستخدم جديد",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    newPasswordOptional: "كلمة المرور الجديدة (اختياري)",
    role: "الدور",
    selectRole: "اختر الدور",
    cancel: "إلغاء",
    create: "إنشاء",
    update: "تحديث",
    user: "المستخدم",
    status: "الحالة",
    lastLogin: "آخر تسجيل دخول",
    actions: "الإجراءات",
    active: "نشط",
    inactive: "غير نشط",
    never: "أبداً",
    noRole: "بدون دور",
    loading: "جارٍ التحميل...",
    userCreated: "تم إنشاء المستخدم",
    userCreatedSuccess: "تم إنشاء المستخدم الجديد بنجاح",
    userUpdated: "تم تحديث المستخدم",
    userUpdatedSuccess: "تم حفظ التغييرات بنجاح",
    createUserError: "خطأ في إنشاء المستخدم",
    createUserErrorMessage: "حدثت مشكلة في إنشاء المستخدم",
    updateUserError: "خطأ في التحديث",
    updateUserErrorMessage: "حدثت مشكلة في تحديث المستخدم",
    adminRoles: "أدوار الإدارة",
    roleName: "اسم الدور",
    description: "الوصف",
    permissionCount: "عدد الصلاحيات",
    adminPermissions: "صلاحيات الإدارة",
    permission: "الصلاحية",
    module: "الوحدة",
    users: "المستخدمون",
    products: "المنتجات",
    crm: "إدارة العملاء",
    shop: "المتجر",
    analytics: "التحليلات",
    content: "المحتوى",
    system: "النظام"
  }
};

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
  isActive: boolean;
  roleId?: number;
  roleName?: string;
  roleDisplayName?: string;
  lastLoginAt?: string;
}

const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function UserManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("users");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // Get current translations
  const t = translations[language];

  // Toggle language function
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

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
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  const users = Array.isArray(usersData) ? usersData : [];

  // Fetch admin roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<AdminRole[]>({
    queryKey: ["/api/admin/roles"],
  });

  // Fetch admin permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<AdminPermission[]>({
    queryKey: ["/api/admin/permissions"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => apiRequest("/api/admin/users", "POST", data),
    onSuccess: () => {
      toast({
        title: t.userCreated,
        description: t.userCreatedSuccess,
      });
      refetchUsers();
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.createUserError,
        description: t.createUserErrorMessage,
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserForm> }) => 
      apiRequest(`/api/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: t.userUpdated,
        description: t.userUpdatedSuccess,
      });
      refetchUsers();
      setEditingUser(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.updateUserError,
        description: t.updateUserErrorMessage,
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

  const getModuleTranslation = (module: string) => {
    return t[module as keyof typeof t] || module;
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToDashboard}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
          </div>
          <Badge variant="destructive" className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            {t.superAdminOnly}
          </Badge>
        </div>
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          {language === 'en' ? 'عربي' : 'English'}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">{t.adminUsers}</TabsTrigger>
          <TabsTrigger value="roles">{t.roles}</TabsTrigger>
          <TabsTrigger value="permissions">{t.permissions}</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.adminUsers}
                </CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t.addUser}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? t.editUser : t.addNewUser}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.username}</FormLabel>
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
                              <FormLabel>{t.email}</FormLabel>
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
                                {editingUser ? t.newPasswordOptional : t.password}
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
                              <FormLabel>{t.role}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t.selectRole} />
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
                            {t.cancel}
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending || updateUserMutation.isPending}
                          >
                            {editingUser ? t.update : t.create}
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
                <div className="text-center py-8">{t.loading}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.user}</TableHead>
                      <TableHead>{t.role}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.lastLogin}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(users) && users.map((user: AdminUser) => (
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
                            <Badge variant="outline">{t.noRole}</Badge>
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
                              {user.isActive ? t.active : t.inactive}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')
                            : t.never
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
                {t.adminRoles}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-8">{t.loading}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.roleName}</TableHead>
                      <TableHead>{t.description}</TableHead>
                      <TableHead>{t.permissionCount}</TableHead>
                      <TableHead>{t.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(role.name)}>
                            {role.displayName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {role.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {role.permissionCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? t.active : t.inactive}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                {t.adminPermissions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8">{t.loading}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.permission}</TableHead>
                      <TableHead>{t.module}</TableHead>
                      <TableHead>{t.description}</TableHead>
                      <TableHead>{t.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          {permission.displayName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPermissionModuleColor(permission.module)}>
                            {getModuleTranslation(permission.module)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {permission.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.isActive ? "default" : "secondary"}>
                            {permission.isActive ? t.active : t.inactive}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserManagement;