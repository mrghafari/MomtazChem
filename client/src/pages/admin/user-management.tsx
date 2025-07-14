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
  Eye,
  EyeOff,
  RefreshCw
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
    roleManagement: "Role Management",
    addUser: "Add User",
    addRole: "Add Role",
    createRole: "Create Role",
    editRole: "Edit Role",
    roleName: "Role Name",
    roleDisplayName: "Role Display Name",
    roleDescription: "Role Description",
    assignPermissions: "Assign Permissions",
    managePermissions: "Manage Permissions",
    assignRole: "Assign Role",
    selectUser: "Select User",
    selectPermissions: "Select Permissions",
    modulePermissions: "Module Permissions",
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
    description: "Description",
    permissionCount: "Permission Count",
    adminPermissions: "Admin Permissions",
    permission: "Permission",
    module: "Module",
    assigned: "Assigned",
    notAssigned: "Not Assigned",
    savePermissions: "Save Permissions",
    roleCreated: "Role Created",
    roleCreatedSuccess: "New role created successfully",
    roleUpdated: "Role Updated", 
    roleUpdatedSuccess: "Role updated successfully",
    permissionsUpdated: "Permissions Updated",
    permissionsUpdatedSuccess: "Role permissions updated successfully",
    roleAssigned: "Role Assigned",
    roleAssignedSuccess: "Role assigned to user successfully",
    deleteRole: "Delete Role",
    confirmDeleteRole: "Are you sure you want to delete this role?",
    cannotDeleteRole: "Cannot delete role that has users assigned",
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
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [showPassword, setShowPassword] = useState(false);

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
    staleTime: 0, // Always fetch fresh data
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

  // Create role form
  const roleForm = useForm({
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; displayName: string; description: string; permissions: number[] }) => 
      apiRequest("/api/admin/roles", "POST", data),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "نقش جدید با موفقیت ایجاد شد",
      });
      setRoleDialogOpen(false);
      setEditingRole(null);
      setSelectedPermissions([]);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد نقش",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: any }) => 
      apiRequest(`/api/admin/roles/${roleId}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "نقش با موفقیت به‌روزرسانی شد",
      });
      setRoleDialogOpen(false);
      setEditingRole(null);
      setSelectedPermissions([]);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی نقش",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => apiRequest(`/api/admin/roles/${roleId}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "نقش با موفقیت حذف شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف نقش",
        variant: "destructive",
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

  // Sync modules mutation
  const syncModulesMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/sync-modules", "POST", {}),
    onSuccess: (response: any) => {
      toast({
        title: "موفقیت",
        description: `${response.addedModules?.length || 0} ماژول جدید همگام‌سازی شد`,
      });
      // Refresh permissions and roles data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/permissions'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در همگام‌سازی ماژول‌ها",
        variant: "destructive",
      });
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
    const colors = {
      'super_admin': 'bg-red-100 text-red-800 border-red-200',
      'site_manager': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'security_admin': 'bg-slate-100 text-slate-800 border-slate-200',
      'products_admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'crm_admin': 'bg-green-100 text-green-800 border-green-200',
      'shop_admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'analytics_admin': 'bg-orange-100 text-orange-800 border-orange-200',
      'content_admin': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'email_manager': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'seo_manager': 'bg-violet-100 text-violet-800 border-violet-200',
      'inventory_manager': 'bg-amber-100 text-amber-800 border-amber-200',
      'order_manager': 'bg-rose-100 text-rose-800 border-rose-200',
      'customer_support': 'bg-teal-100 text-teal-800 border-teal-200',
      'factory_manager': 'bg-gray-100 text-gray-800 border-gray-200',
      'financial_admin': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'warehouse_admin': 'bg-lime-100 text-lime-800 border-lime-200',
      'logistics_admin': 'bg-sky-100 text-sky-800 border-sky-200',
      'department_manager': 'bg-pink-100 text-pink-800 border-pink-200',
      'readonly_analyst': 'bg-neutral-100 text-neutral-800 border-neutral-200',
      'regional_manager': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'quality_controller': 'bg-stone-100 text-stone-800 border-stone-200',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleCategory = (roleName: string) => {
    if (['super_admin', 'site_manager', 'security_admin'].includes(roleName)) {
      return 'Core Admin';
    }
    if (['financial_admin', 'warehouse_admin', 'logistics_admin', 'department_manager'].includes(roleName)) {
      return 'Department';
    }
    if (['email_manager', 'seo_manager', 'inventory_manager', 'customer_support', 'factory_manager', 'quality_controller'].includes(roleName)) {
      return 'Specialized';
    }
    if (['products_admin', 'crm_admin', 'shop_admin', 'analytics_admin', 'content_admin'].includes(roleName)) {
      return 'Module Admin';
    }
    if (['readonly_analyst', 'regional_manager'].includes(roleName)) {
      return 'Limited Access';
    }
    return 'Standard';
  };

  const getRoleCategoryColor = (roleName: string) => {
    const category = getRoleCategory(roleName);
    const colors = {
      'Core Admin': 'border-red-300 text-red-700',
      'Department': 'border-green-300 text-green-700',
      'Specialized': 'border-purple-300 text-purple-700',
      'Module Admin': 'border-blue-300 text-blue-700',
      'Limited Access': 'border-gray-300 text-gray-700',
      'Standard': 'border-orange-300 text-orange-700',
    };
    return colors[category] || 'border-gray-300 text-gray-700';
  };

  const getPermissionModuleColor = (module: string) => {
    const colors = {
      'users': 'bg-red-50 text-red-700 border-red-200',
      'products': 'bg-blue-50 text-blue-700 border-blue-200',
      'crm': 'bg-green-50 text-green-700 border-green-200',
      'shop': 'bg-purple-50 text-purple-700 border-purple-200',
      'analytics': 'bg-orange-50 text-orange-700 border-orange-200',
      'content': 'bg-teal-50 text-teal-700 border-teal-200',
      'system': 'bg-gray-50 text-gray-700 border-gray-200',
      'email': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'seo': 'bg-violet-50 text-violet-700 border-violet-200',
      'inventory': 'bg-amber-50 text-amber-700 border-amber-200',
      'orders': 'bg-rose-50 text-rose-700 border-rose-200',
      'support': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'site': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'factory': 'bg-slate-50 text-slate-700 border-slate-200',
      'security': 'bg-zinc-50 text-zinc-700 border-zinc-200',
      'departments': 'bg-pink-50 text-pink-700 border-pink-200',
      'regional': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'quality': 'bg-stone-50 text-stone-700 border-stone-200',
    };
    return colors[module] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getModuleTranslation = (module: string) => {
    const translations = {
      'users': 'Users',
      'products': 'Products',
      'crm': 'CRM',
      'shop': 'Shop',
      'analytics': 'Analytics',
      'content': 'Content',
      'system': 'System',
      'email': 'Email',
      'seo': 'SEO',
      'inventory': 'Inventory',
      'orders': 'Orders',
      'support': 'Support',
      'site': 'Site Management',
      'factory': 'Factory',
      'security': 'Security',
      'departments': 'Departments',
      'regional': 'Regional',
      'quality': 'Quality Control',
    };
    return translations[module] || module;
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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => syncModulesMutation.mutate()}
            variant="outline"
            size="sm"
            disabled={syncModulesMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncModulesMutation.isPending ? 'animate-spin' : ''}`} />
            {language === 'en' ? 'Sync Modules' : 'همگام‌سازی ماژول‌ها'}
          </Button>
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
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    {...field} 
                                    className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
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
                                <SelectContent className="max-h-96">
                                  {/* Core Administrative Roles */}
                                  <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50">
                                    Core Administrative Roles
                                  </div>
                                  {roles?.filter(role => ['super_admin', 'site_manager', 'security_admin'].includes(role.name)).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getRoleBadgeColor(role.name)} variant="outline">
                                          {role.displayName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({role.permissionCount || 0} permissions)
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  
                                  {/* Department Roles */}
                                  <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 mt-2">
                                    Department Management
                                  </div>
                                  {roles?.filter(role => ['financial_admin', 'warehouse_admin', 'logistics_admin', 'department_manager'].includes(role.name)).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getRoleBadgeColor(role.name)} variant="outline">
                                          {role.displayName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({role.permissionCount || 0} permissions)
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  
                                  {/* Specialized Roles */}
                                  <div className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 mt-2">
                                    Specialized Roles
                                  </div>
                                  {roles?.filter(role => ['email_manager', 'seo_manager', 'inventory_manager', 'customer_support', 'factory_manager', 'quality_controller'].includes(role.name)).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getRoleBadgeColor(role.name)} variant="outline">
                                          {role.displayName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({role.permissionCount || 0} permissions)
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  
                                  {/* Module Admin Roles */}
                                  <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 mt-2">
                                    Module Administration
                                  </div>
                                  {roles?.filter(role => ['products_admin', 'crm_admin', 'shop_admin', 'analytics_admin', 'content_admin'].includes(role.name)).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getRoleBadgeColor(role.name)} variant="outline">
                                          {role.displayName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({role.permissionCount || 0} permissions)
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  
                                  {/* Limited Access Roles */}
                                  <div className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50 mt-2">
                                    Limited Access
                                  </div>
                                  {roles?.filter(role => ['readonly_analyst', 'regional_manager', 'order_manager'].includes(role.name)).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getRoleBadgeColor(role.name)} variant="outline">
                                          {role.displayName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({role.permissionCount || 0} permissions)
                                        </span>
                                      </div>
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
          {/* Role Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700">Core Administrative Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles?.filter(role => ['super_admin', 'site_manager', 'security_admin'].includes(role.name)).map(role => (
                  <div key={role.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{role.displayName}</span>
                    <Badge variant="outline" className="text-xs">{role.permissionCount || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700">Department Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles?.filter(role => ['financial_admin', 'warehouse_admin', 'logistics_admin', 'department_manager'].includes(role.name)).map(role => (
                  <div key={role.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{role.displayName}</span>
                    <Badge variant="outline" className="text-xs">{role.permissionCount || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-purple-700">Specialized Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles?.filter(role => ['email_manager', 'seo_manager', 'inventory_manager', 'customer_support'].includes(role.name)).map(role => (
                  <div key={role.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{role.displayName}</span>
                    <Badge variant="outline" className="text-xs">{role.permissionCount || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Complete Roles Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  مدیریت نقش‌ها
                </CardTitle>
                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      افزودن نقش جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRole ? "ویرایش نقش" : "افزودن نقش جدید"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...roleForm}>
                      <form onSubmit={roleForm.handleSubmit((data) => {
                        if (editingRole) {
                          updateRoleMutation.mutate({
                            roleId: editingRole.id,
                            data: { ...data, permissions: selectedPermissions }
                          });
                        } else {
                          createRoleMutation.mutate({ ...data, permissions: selectedPermissions });
                        }
                      })} className="space-y-4">
                        <FormField
                          control={roleForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام سیستمی نقش</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="manager_role" />
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
                              <FormLabel>نام نمایشی نقش</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="مدیر بخش" />
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
                              <FormLabel>توضیحات نقش</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="توضیح کامل نقش و وظایف..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-3">
                          <label className="text-sm font-medium">دسترسی‌های نقش</label>
                          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPermissions(prev => [...prev, permission.id]);
                                    } else {
                                      setSelectedPermissions(prev => prev.filter(id => id !== permission.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-xs cursor-pointer"
                                >
                                  {permission.displayName}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setRoleDialogOpen(false);
                            setEditingRole(null);
                            setSelectedPermissions([]);
                            roleForm.reset();
                          }}>
                            لغو
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {editingRole ? "به‌روزرسانی" : "ایجاد"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-8">{t.loading}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نقش</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>تعداد دسترسی‌ها</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{role.displayName}</div>
                            <div className="text-sm text-muted-foreground">{role.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleCategoryColor(role.name)}>
                            {getRoleCategory(role.name)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.permissionCount || 0} دسترسی</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={role.isActive}
                            disabled={role.name === 'super_admin'} // Super admin cannot be deactivated
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRole(role);
                                // Load current permissions for editing
                                setSelectedPermissions([]); // You'd fetch actual permissions here
                                roleForm.setValue('name', role.name);
                                roleForm.setValue('displayName', role.displayName);
                                roleForm.setValue('description', role.description);
                                setRoleDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {role.name !== 'super_admin' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('آیا مطمئن هستید که می‌خواهید این نقش را حذف کنید؟')) {
                                    deleteRoleMutation.mutate(role.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                لیست کامل دسترسی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8">{t.loading}</div>
              ) : (
                <div className="space-y-6">
                  {/* Group permissions by module */}
                  {Object.entries(
                    permissions.reduce((groups, permission) => {
                      const module = permission.module;
                      if (!groups[module]) groups[module] = [];
                      groups[module].push(permission);
                      return groups;
                    }, {} as Record<string, AdminPermission[]>)
                  ).map(([module, modulePermissions]) => (
                    <Card key={module} className={`border ${getPermissionModuleColor(module)}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge className={getPermissionModuleColor(module)}>
                            {getModuleTranslation(module)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {modulePermissions.length} دسترسی
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {modulePermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="p-3 bg-white rounded border hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{permission.displayName}</span>
                                <Badge 
                                  variant={permission.isActive ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {permission.isActive ? 'فعال' : 'غیرفعال'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{permission.description}</p>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {permission.name}
                              </code>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserManagement;