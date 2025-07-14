import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Key, 
  UserPlus, 
  Edit, 
  Trash2, 
  Settings,
  Plus,
  Save,
  UserCheck,
  Crown,
  Eye,
  EyeOff,
  MessageSquare,
  Phone,
  Mail,
  Lock,
  Send,
  ShoppingCart,
  Package,
  BarChart3,
  DollarSign,
  Warehouse,
  Truck,
  FileText,
  Database,
  Search,
  Zap,
  Globe,
  Smartphone,
  HardDrive,
  UserCog,
  Calendar,
  QrCode,
  Factory,
  Users2,
  BookOpen,
  TestTube,
  CreditCard,
  Wallet,
  MapPin,
  RefreshCw,
  Edit3,
  Ticket
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

// Schema definitions
const roleSchema = z.object({
  name: z.string().min(2, 'نام نقش باید حداقل 2 کاراکتر باشد'),
  displayName: z.string().min(2, 'نام نمایشی باید حداقل 2 کاراکتر باشد'),
  description: z.string().optional(),
  color: z.string().default('#3b82f6'),
  priority: z.number().default(1)
});

const userSchema = z.object({
  fullName: z.string().min(2, 'نام کامل باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  phone: z.string().min(10, 'شماره تلفن باید حداقل 10 رقم باشد'),
  password: z.string().min(6, 'پسورد باید حداقل 6 کاراکتر باشد'),
  roleId: z.string().min(1, 'نقش را انتخاب کنید'),
  isActive: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(true)
});

type Role = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  priority: number;
  permissions: string[];
  userCount?: number;
  isActive: boolean;
  createdAt: string;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  roleColor: string;
  isActive: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  lastLogin?: string;
  createdAt: string;
};

type Module = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  isCore: boolean;
  icon?: any;
  color?: string;
};

// Available modules for permission assignment - using exact names from Site Management
const availableModules: Module[] = [
  { id: 'syncing-shop', name: 'syncing_shop', displayName: 'Syncing Shop', description: 'همگام‌سازی محصولات بین کاردکس و فروشگاه', category: 'operations', isCore: true, icon: Database, color: 'bg-blue-500' },
  { id: 'shop', name: 'shop_management', displayName: 'Shop', description: 'مدیریت فروشگاه آنلاین، محصولات و فروش', category: 'sales', isCore: true, icon: ShoppingCart, color: 'bg-purple-500' },
  { id: 'abandoned-cart', name: 'abandoned_cart', displayName: 'Abandoned Cart', description: 'مدیریت سبدهای خرید رها شده', category: 'sales', isCore: false, icon: ShoppingCart, color: 'bg-red-500' },
  { id: 'products', name: 'product_management', displayName: 'Products', description: 'مدیریت کاتالوگ محصولات و مشخصات', category: 'sales', isCore: true, icon: Package, color: 'bg-violet-500' },
  { id: 'crm', name: 'crm_management', displayName: 'CRM', description: 'سیستم مدیریت ارتباط با مشتریان', category: 'customer', isCore: true, icon: Users, color: 'bg-pink-500' },
  { id: 'order-management', name: 'order_management', displayName: 'Order Management', description: 'مدیریت سفارشات و پردازش آن‌ها', category: 'sales', isCore: true, icon: Truck, color: 'bg-orange-500' },
  { id: 'inventory-management', name: 'inventory_management', displayName: 'Inventory Management', description: 'مدیریت موجودی و کنترل انبار', category: 'operations', isCore: true, icon: Package, color: 'bg-emerald-500' },
  { id: 'inquiries', name: 'inquiry_management', displayName: 'Inquiries', description: 'مدیریت استعلامات و درخواست‌های مشتریان', category: 'customer', isCore: false, icon: BarChart3, color: 'bg-amber-500' },
  { id: 'barcode', name: 'barcode_management', displayName: 'Barcode', description: 'مدیریت بارکدهای محصولات', category: 'operations', isCore: false, icon: QrCode, color: 'bg-cyan-500' },
  { id: 'email-settings', name: 'email_management', displayName: 'Email Settings', description: 'تنظیمات ایمیل و اطلاع‌رسانی', category: 'communication', isCore: false, icon: Mail, color: 'bg-emerald-500' },
  { id: 'database-backup', name: 'backup_management', displayName: 'Database Backup', description: 'پشتیبان‌گیری از پایگاه داده', category: 'system', isCore: false, icon: Database, color: 'bg-slate-500' },
  { id: 'seo', name: 'seo_management', displayName: 'SEO', description: 'بهینه‌سازی موتورهای جستجو', category: 'marketing', isCore: false, icon: Globe, color: 'bg-purple-500' },
  { id: 'categories', name: 'category_management', displayName: 'Categories', description: 'مدیریت دسته‌بندی محصولات', category: 'operations', isCore: false, icon: Package, color: 'bg-blue-500' },
  { id: 'sms', name: 'sms_management', displayName: 'SMS', description: 'سیستم پیامک و اطلاع‌رسانی', category: 'communication', isCore: false, icon: MessageSquare, color: 'bg-green-500' },
  { id: 'factory', name: 'factory_management', displayName: 'Factory', description: 'مدیریت خط تولید و کارخانه', category: 'operations', isCore: false, icon: Factory, color: 'bg-purple-500' },
  { id: 'super-admin', name: 'super_admin', displayName: 'Super Admin', description: 'تنظیمات مدیریت ارشد سیستم', category: 'system', isCore: true, icon: UserCog, color: 'bg-indigo-500' },
  { id: 'user-management', name: 'user_management', displayName: 'User Management', description: 'مدیریت کاربران و دسترسی‌ها', category: 'system', isCore: true, icon: Users2, color: 'bg-red-500' },
  { id: 'procedures', name: 'procedures_management', displayName: 'Procedures', description: 'مدیریت رویه‌ها و فرآیندها', category: 'operations', isCore: false, icon: BookOpen, color: 'bg-amber-500' },
  { id: 'smtp-test', name: 'smtp_test', displayName: 'SMTP Test', description: 'تست تنظیمات سرور ایمیل', category: 'communication', isCore: false, icon: TestTube, color: 'bg-sky-500' },
  { id: 'payment-settings', name: 'payment_management', displayName: 'Payment Settings', description: 'تنظیمات پرداخت و درگاه‌ها', category: 'finance', isCore: false, icon: CreditCard, color: 'bg-blue-500' },
  { id: 'wallet-management', name: 'wallet_management', displayName: 'Wallet Management', description: 'مدیریت کیف پول مشتریان', category: 'finance', isCore: false, icon: Wallet, color: 'bg-yellow-500' },
  { id: 'geography-analytics', name: 'geography_analytics', displayName: 'Geography Analytics', description: 'آنالیتیکس جغرافیایی فروش', category: 'analytics', isCore: false, icon: MapPin, color: 'bg-teal-500' },
  { id: 'ai-settings', name: 'ai_management', displayName: 'AI Settings', description: 'تنظیمات هوش مصنوعی', category: 'system', isCore: false, icon: Zap, color: 'bg-purple-500' },
  { id: 'refresh-control', name: 'refresh_control', displayName: 'Refresh Control', description: 'کنترل به‌روزرسانی سیستم', category: 'system', isCore: false, icon: RefreshCw, color: 'bg-indigo-500' },
  { id: 'department-users', name: 'department_users', displayName: 'Department Users', description: 'مدیریت کاربران بخش‌ها', category: 'system', isCore: false, icon: Users, color: 'bg-emerald-500' },
  { id: 'content-management', name: 'content_management', displayName: 'Content Management', description: 'مدیریت محتوای وب‌سایت', category: 'content', isCore: false, icon: Edit3, color: 'bg-green-500' },
  { id: 'ticketing-system', name: 'ticketing_system', displayName: 'Ticketing System', description: 'سیستم تیکت و پشتیبانی', category: 'communication', isCore: false, icon: Ticket, color: 'bg-red-500' }
];

function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  
  // Editing states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Permission selection
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Forms
  const roleForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      color: '#3b82f6',
      priority: 1
    }
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      roleId: '',
      isActive: true,
      smsNotifications: true,
      emailNotifications: true
    }
  });

  // Data fetching
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/admin/custom-roles'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/custom-roles');
      return response.data || [];
    }
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/custom-users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/custom-users');
      return response.data || [];
    }
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/custom-roles', {
        method: 'POST',
        body: { ...data, permissions: selectedPermissions }
      });
    },
    onSuccess: () => {
      toast({ title: 'نقش جدید با موفقیت ایجاد شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-roles'] });
      setRoleDialogOpen(false);
      roleForm.reset();
      setSelectedPermissions([]);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: any }) => {
      return apiRequest(`/api/admin/custom-roles/${roleId}`, {
        method: 'PATCH',
        body: { ...data, permissions: selectedPermissions }
      });
    },
    onSuccess: () => {
      toast({ title: 'نقش با موفقیت به‌روزرسانی شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-roles'] });
      setRoleDialogOpen(false);
      setEditingRole(null);
      roleForm.reset();
      setSelectedPermissions([]);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest(`/api/admin/custom-roles/${roleId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: 'نقش با موفقیت حذف شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-roles'] });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/custom-users', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({ title: 'کاربر جدید با موفقیت ایجاد شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-users'] });
      setUserDialogOpen(false);
      userForm.reset();
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return apiRequest(`/api/admin/custom-users/${userId}`, {
        method: 'PATCH',
        body: data
      });
    },
    onSuccess: () => {
      toast({ title: 'کاربر با موفقیت به‌روزرسانی شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-users'] });
      setUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/custom-users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: 'کاربر با موفقیت حذف شد' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-users'] });
    }
  });

  const sendSmsMutation = useMutation({
    mutationFn: async ({ userIds, message }: { userIds: string[]; message: string }) => {
      return apiRequest('/api/admin/send-sms', {
        method: 'POST',
        body: { userIds, message }
      });
    },
    onSuccess: () => {
      toast({ title: 'پیامک با موفقیت ارسال شد' });
      setSmsDialogOpen(false);
      setSelectedUsers([]);
    }
  });

  // Helper functions
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sales: 'bg-green-100 text-green-800',
      customer: 'bg-blue-100 text-blue-800',
      operations: 'bg-yellow-100 text-yellow-800',
      finance: 'bg-purple-100 text-purple-800',
      analytics: 'bg-indigo-100 text-indigo-800',
      content: 'bg-pink-100 text-pink-800',
      marketing: 'bg-orange-100 text-orange-800',
      communication: 'bg-cyan-100 text-cyan-800',
      system: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getModulesByCategory = () => {
    return availableModules.reduce((acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  };

  // Authentication check
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <div className="py-12">
          <div className="text-lg">در حال بررسی احراز هویت...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <Lock className="h-6 w-6" />
              دسترسی محدود
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              برای دسترسی به مدیریت کاربران باید ابتدا وارد سیستم شوید.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin/login'} 
              className="w-full"
            >
              ورود به سیستم مدیریت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت کاربران و نقش‌ها</h1>
          <p className="text-muted-foreground">مدیریت کامل کاربران، نقش‌ها و دسترسی‌ها</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSmsDialogOpen(true)} disabled={selectedUsers.length === 0}>
            <MessageSquare className="h-4 w-4 mr-2" />
            ارسال SMS ({selectedUsers.length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            کاربران ({users.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            نقش‌ها ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            ماژول‌ها ({availableModules.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  لیست کاربران
                </CardTitle>
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      افزودن کاربر جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => {
                        if (editingUser) {
                          updateUserMutation.mutate({ userId: editingUser.id, data });
                        } else {
                          createUserMutation.mutate(data);
                        }
                      })} className="space-y-4">
                        <FormField
                          control={userForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کامل</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="نام و نام خانوادگی" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ایمیل</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="user@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={userForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شماره تلفن</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="09123456789" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>پسورد</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="رمز عبور" />
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
                              <FormLabel>نقش کاربر</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="نقش را انتخاب کنید" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: role.color }}
                                        />
                                        {role.displayName}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={userForm.control}
                            name="smsNotifications"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">اطلاع‌رسانی SMS</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    دریافت پیامک
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">اطلاع‌رسانی ایمیل</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    دریافت ایمیل
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setUserDialogOpen(false);
                            setEditingUser(null);
                            userForm.reset();
                          }}>
                            لغو
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending || updateUserMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {editingUser ? "به‌روزرسانی" : "ایجاد"}
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
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  هیچ کاربری یافت نشد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={selectedUsers.length === users.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(users.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>تماس</TableHead>
                      <TableHead>اطلاع‌رسانی</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, user.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: user.roleColor, color: 'white' }}
                            className="font-medium"
                          >
                            {user.roleDisplayName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.smsNotifications && (
                              <Badge variant="outline" className="text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                SMS
                              </Badge>
                            )}
                            {user.emailNotifications && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                userForm.setValue('fullName', user.fullName);
                                userForm.setValue('email', user.email);
                                userForm.setValue('phone', user.phone);
                                userForm.setValue('roleId', user.roleId);
                                userForm.setValue('smsNotifications', user.smsNotifications);
                                userForm.setValue('emailNotifications', user.emailNotifications);
                                setUserDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟')) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

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

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={roleForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رنگ نقش</FormLabel>
                                <FormControl>
                                  <Input {...field} type="color" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={roleForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>اولویت نقش</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" min="1" max="10" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            دسترسی‌های ماژولی
                            <Badge variant="outline" className="text-xs">
                              {selectedPermissions.length} انتخاب شده
                            </Badge>
                          </label>
                          <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                            {Object.entries(getModulesByCategory()).map(([category, modules]) => (
                              <div key={category} className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                  <Badge className={`${getCategoryColor(category)} text-white px-2 py-1`}>
                                    {category === 'sales' && 'فروش و بازار'}
                                    {category === 'customer' && 'مشتری و CRM'}
                                    {category === 'operations' && 'عملیات'}
                                    {category === 'finance' && 'مالی'}
                                    {category === 'analytics' && 'آنالیتیک'}
                                    {category === 'content' && 'محتوا'}
                                    {category === 'marketing' && 'بازاریابی'}
                                    {category === 'communication' && 'ارتباطات'}
                                    {category === 'system' && 'سیستم'}
                                  </Badge>

                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {modules.map((module) => {
                                    const IconComponent = module.icon || Settings;
                                    return (
                                      <div 
                                        key={module.id} 
                                        className="flex items-center gap-3 p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                                      >
                                        <Checkbox
                                          id={`module-${module.id}`}
                                          checked={selectedPermissions.includes(module.name)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedPermissions(prev => [...prev, module.name]);
                                            } else {
                                              setSelectedPermissions(prev => prev.filter(p => p !== module.name));
                                            }
                                          }}
                                        />
                                        <div className={`p-1 rounded ${module.color || 'bg-gray-500'} text-white`}>
                                          <IconComponent className="h-3 w-3" />
                                        </div>
                                        <label 
                                          htmlFor={`module-${module.id}`}
                                          className="text-xs cursor-pointer flex items-center gap-2 flex-1"
                                        >
                                          <span className="font-medium">{module.displayName}</span>
                                          {module.isCore && (
                                            <Crown className="h-3 w-3 text-yellow-500" />
                                          )}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
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
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  هیچ نقشی تعریف نشده است
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <Card key={role.id} className="border-2" style={{ borderColor: role.color }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: role.color }}
                            />
                            <CardTitle className="text-lg">{role.displayName}</CardTitle>
                          </div>
                          <Badge variant="outline">#{role.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">تعداد کاربران:</span>
                          <Badge>{role.userCount || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">دسترسی‌ها:</span>
                          <Badge variant="outline">{role.permissions.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">وضعیت:</span>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRole(role);
                              setSelectedPermissions(role.permissions);
                              roleForm.setValue('name', role.name);
                              roleForm.setValue('displayName', role.displayName);
                              roleForm.setValue('description', role.description || '');
                              roleForm.setValue('color', role.color);
                              roleForm.setValue('priority', role.priority);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                ماژول‌های سیستم و دسترسی‌ها
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                مدیریت دسترسی کاربران به ماژول‌های مختلف سیستم
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(getModulesByCategory()).map(([category, modules]) => (
                  <Card key={category} className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <Badge className={`${getCategoryColor(category)} text-white px-3 py-1`}>
                          {category === 'sales' && 'ماژول‌های فروش و بازار'}
                          {category === 'customer' && 'ماژول‌های مشتری و CRM'}
                          {category === 'operations' && 'ماژول‌های عملیاتی'}
                          {category === 'finance' && 'ماژول‌های مالی'}
                          {category === 'analytics' && 'ماژول‌های آنالیتیک'}
                          {category === 'content' && 'ماژول‌های محتوا'}
                          {category === 'marketing' && 'ماژول‌های بازاریابی'}
                          {category === 'communication' && 'ماژول‌های ارتباطات'}
                          {category === 'system' && 'ماژول‌های سیستم'}
                        </Badge>
                        <span className="text-base text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          {modules.length} ماژول
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {modules.map((module) => {
                          const IconComponent = module.icon || Settings;
                          return (
                            <Card
                              key={module.id}
                              className="relative overflow-hidden border-2 hover:border-blue-300 transition-all duration-200 hover:shadow-md group"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={`p-2 rounded-lg ${module.color || 'bg-gray-500'} text-white`}>
                                    <IconComponent className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                                        {module.displayName}
                                      </h4>
                                      {module.isCore && (
                                        <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                      {module.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <Badge 
                                    variant={module.isCore ? "default" : "secondary"}
                                    className="text-xs px-2 py-1"
                                  >
                                    {module.isCore ? 'ماژول هسته‌ای' : 'ماژول اضافی'}
                                  </Badge>
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                                    {module.name}
                                  </code>
                                </div>
                                
                                {/* Hover effect overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SMS Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ارسال پیامک جمعی</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">گیرندگان ({selectedUsers.length} کاربر)</label>
              <div className="mt-2 space-y-1">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      {user.fullName} - {user.phone}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            
            <div>
              <label htmlFor="sms-message" className="text-sm font-medium">متن پیامک</label>
              <Textarea
                id="sms-message"
                placeholder="متن پیامک خود را وارد کنید..."
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>
                لغو
              </Button>
              <Button 
                onClick={() => {
                  const message = (document.getElementById('sms-message') as HTMLTextAreaElement)?.value;
                  if (message && selectedUsers.length > 0) {
                    sendSmsMutation.mutate({ userIds: selectedUsers, message });
                  }
                }}
                disabled={sendSmsMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                ارسال پیامک
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;