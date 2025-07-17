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
  Ticket,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().default('#3b82f6'),
  priority: z.number().default(1)
});

const userSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Please select a role'),
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

// Function to extract modules dynamically from Site Management configuration
const extractSiteManagementModules = (): Module[] => {
  // Complete synchronized list with ALL 24 modules from Site Management - using original English names
  const siteManagementModules = [
    { moduleId: 'syncing_shop', label: 'Syncing Shop', icon: Database, color: 'bg-blue-500' },
    { moduleId: 'shop_management', label: 'Shop Management', icon: ShoppingCart, color: 'bg-purple-500' },
    { moduleId: 'product_management', label: 'Product Management', icon: Package, color: 'bg-violet-500' },
    { moduleId: 'order_management', label: 'Order Management', icon: Truck, color: 'bg-orange-500' },
    { moduleId: 'warehouse-management', label: 'Warehouse Management', icon: Warehouse, color: 'bg-emerald-500' },
    { moduleId: 'logistics_management', label: 'Logistics Management', icon: Truck, color: 'bg-indigo-500' },
    { moduleId: 'crm', label: 'CRM', icon: Users, color: 'bg-pink-500' },
    { moduleId: 'wallet_management', label: 'Wallet Management', icon: Wallet, color: 'bg-yellow-500' },
    { moduleId: 'payment_settings', label: 'Payment Settings', icon: CreditCard, color: 'bg-red-500' },
    { moduleId: 'geography_analytics', label: 'Geography Analytics', icon: MapPin, color: 'bg-teal-500' },
    { moduleId: 'inquiries', label: 'Inquiries', icon: BarChart3, color: 'bg-amber-500' },
    { moduleId: 'email_settings', label: 'Email Settings', icon: Mail, color: 'bg-cyan-500' },
    { moduleId: 'content_management', label: 'Content Management', icon: Edit3, color: 'bg-lime-500' },
    { moduleId: 'seo', label: 'SEO Management', icon: Globe, color: 'bg-emerald-500' },
    { moduleId: 'categories', label: 'Categories', icon: Package, color: 'bg-violet-500' },
    { moduleId: 'barcode', label: 'Barcode Management', icon: QrCode, color: 'bg-rose-500' },
    { moduleId: 'database_backup', label: 'Database Backup', icon: Database, color: 'bg-stone-500' },
    { moduleId: 'ai_settings', label: 'AI Settings', icon: Zap, color: 'bg-sky-500' },
    { moduleId: 'user_management', label: 'User Management', icon: UserCog, color: 'bg-slate-500' },
    { moduleId: 'sms', label: 'SMS Management', icon: Smartphone, color: 'bg-gray-500' },
    { moduleId: 'factory', label: 'Factory Management', icon: Factory, color: 'bg-neutral-500' },
    { moduleId: 'procedures', label: 'Procedures', icon: BookOpen, color: 'bg-zinc-500' },
    { moduleId: 'refresh_control', label: 'Refresh Control', icon: RefreshCw, color: 'bg-green-500' },
    { moduleId: 'ticketing_system', label: 'Ticketing System', icon: Ticket, color: 'bg-rose-500' }
  ];

  return siteManagementModules.map(module => ({
    id: module.moduleId.replace('_', '-'),
    name: module.moduleId,
    displayName: module.label,
    description: `${module.label} Module`,
    category: 'system',
    isCore: ['syncing_shop', 'shop_management', 'product_management', 'order_management', 'warehouse-management', 'crm', 'user_management'].includes(module.moduleId),
    icon: module.icon,
    color: module.color
  }));
};

// This will be populated dynamically from the API
let availableModules: Module[] = [];

function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Editing states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  
  // Permission selection
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  
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
    },
    staleTime: 0 // Force fresh data to see permission count fix
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/custom-users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/custom-users');
      return response.data || [];
    }
  });

  // Get refresh interval from global settings for CRM modules
  const getCrmRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const crmSettings = settings.departments.crm;
      
      if (crmSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : crmSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 300000; // Default 5 minutes if no settings found
  };

  // Fetch modules directly from the synchronized API endpoint
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/custom-modules'],
    queryFn: async () => {
      const response = await apiRequest('/api/custom-modules');
      return response;
    },
    staleTime: 0, // Always fetch fresh data to stay synchronized
    refetchInterval: getCrmRefreshInterval()
  });

  // Also fetch Site Management modules for comparison
  const { data: siteManagementModules = [], isLoading: siteModulesLoading } = useQuery({
    queryKey: ['/api/site-management/modules'],
    queryFn: async () => {
      const response = await apiRequest('/api/site-management/modules');
      return response.modules || [];
    },
    staleTime: 0,
    refetchInterval: getCrmRefreshInterval()
  });

  // Build availableModules from the synchronized API
  const availableModules = React.useMemo(() => {
    if (!modulesData?.modules) return [];
    
    return modulesData.modules.map((module: any) => {
      const staticModule = extractSiteManagementModules().find(m => m.moduleId === module.id);
      return {
        id: module.id,
        name: module.name,
        displayName: module.name,
        description: module.description,
        category: module.category,
        isCore: true,
        icon: staticModule?.icon || Package,
        color: staticModule?.color || 'bg-gray-500',
        moduleId: module.id
      };
    });
  }, [modulesData]);

  // Check if modules are out of sync and show warning
  const isOutOfSync = React.useMemo(() => {
    if (!siteManagementModules.length || !modulesData?.modules) return false;
    
    const siteModuleIds = siteManagementModules.sort();
    const customModuleIds = modulesData.modules.map((m: any) => m.id).sort();
    
    return JSON.stringify(siteModuleIds) !== JSON.stringify(customModuleIds);
  }, [siteManagementModules, modulesData]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/custom-roles', {
        method: 'POST',
        body: { ...data, permissions: selectedPermissions }
      });
    },
    onSuccess: () => {
      toast({ title: 'New role created successfully' });
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
      toast({ title: 'Role updated successfully' });
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
      toast({ title: 'Role deleted successfully' });
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
      toast({ title: 'New user created successfully' });
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
      toast({ title: 'User updated successfully' });
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
      toast({ title: 'User deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-users'] });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return apiRequest(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        body: { newPassword }
      });
    },
    onSuccess: () => {
      toast({ title: 'Password changed successfully' });
      setPasswordDialogOpen(false);
      setPasswordUserId(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to change password',
        variant: 'destructive' 
      });
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
      toast({ title: 'SMS sent successfully' });
      setSmsDialogOpen(false);
      setSelectedUsers([]);
    }
  });

  // Get current Site Management modules for comparison
  const { data: siteModules } = useQuery({
    queryKey: ['/api/site-management/modules'],
    staleTime: getCrmRefreshInterval() / 1000 // Use same interval as other CRM data
  });

  // Check for module count mismatch
  const moduleCountMismatch = siteModules && siteModules.count !== availableModules.length;

  // Sync modules mutation
  const syncModulesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/user-management/sync-modules', { method: 'POST' });
    },
    onSuccess: () => {
      toast({ 
        title: 'Sync Successful', 
        description: 'Modules synchronized with Site Management' 
      });
      // Refresh data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-roles'] });
      // Force refresh of the modules display based on global settings
      const getCrmRefreshInterval = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const crmSettings = settings.departments.crm;
          
          if (crmSettings?.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : crmSettings.interval;
            return refreshInterval * 1000; // Convert seconds to milliseconds
          }
        }
        return 300000; // Default 5 minutes if no settings found
      };

      const delayMs = Math.min(getCrmRefreshInterval() / 10, 2000); // Maximum 2 seconds delay
      setTimeout(() => {
        window.location.reload();
      }, delayMs);
    },
    onError: () => {
      toast({ 
        title: 'Sync Error', 
        description: 'Problem occurred during module synchronization' 
      });
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
      {/* Module Sync Status Alert */}
      {moduleCountMismatch && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">نیاز به همگام‌سازی ماژول‌ها</AlertTitle>
          <AlertDescription className="text-amber-700">
            Site Management دارای {siteManagementModules.length || 'نامشخص'} ماژول است، اما User Management دارای {availableModules.length} ماژول است.
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2 mt-2"
              onClick={() => syncModulesMutation.mutate()}
              disabled={syncModulesMutation.isPending}
            >
              {syncModulesMutation.isPending ? 'در حال همگام‌سازی...' : 'همگام‌سازی کن'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت کاربران و نقش‌ها</h1>
          <p className="text-muted-foreground">
            مدیریت کامل کاربران، نقش‌ها و دسترسی‌ها
            {siteManagementModules.length > 0 && (
              <span className="text-green-600 mr-2">
                ✓ همگام با Site Management ({siteManagementModules.length} ماژول)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => syncModulesMutation.mutate()}
            disabled={syncModulesMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncModulesMutation.isPending ? 'animate-spin' : ''}`} />
            همگام‌سازی ماژول‌ها
          </Button>
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
                  User List
                </CardTitle>
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? "Edit User" : "Add New User"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => {
                        console.log('Form submitted with data:', data);
                        console.log('Form errors:', userForm.formState.errors);
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
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="First and Last Name" />
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
                                <FormLabel>Email</FormLabel>
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
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="+1234567890" />
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
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password"
                                    className="pl-10" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
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
                              <FormLabel>User Role</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  console.log('Role selected:', value);
                                  field.onChange(value);
                                }} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
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
                                  <FormLabel className="text-base">SMS Notifications</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Receive SMS messages
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
                                  <FormLabel className="text-base">Email Notifications</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Receive emails
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
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending || updateUserMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {editingUser ? "Update" : "Create"}
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
                <div className="text-center py-8">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
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
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Notifications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
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
                            {user.isActive ? 'Active' : 'Inactive'}
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
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPasswordUserId(user.id);
                                setPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
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
                  Role Management
                </CardTitle>
                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Role
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
                        
                        {/* Drag and Drop Module Assignment Interface */}
                        <div className="space-y-4">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Module Assignment
                            <Badge variant="outline" className="text-xs">
                              {selectedPermissions.length} assigned
                            </Badge>
                          </label>
                          
                          <div className="grid grid-cols-2 gap-6 min-h-[400px]">
                            {/* Available Modules Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Package className="h-4 w-4 text-blue-600" />
                                <h3 className="font-medium text-blue-800">Available Modules</h3>
                                <Badge variant="secondary" className="ml-auto">
                                  {availableModules.filter(m => !selectedPermissions.includes(m.name)).length}
                                </Badge>
                              </div>
                              
                              <div className="max-h-80 overflow-y-auto p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                                <div className="space-y-2">
                                  {availableModules
                                    .filter(module => !selectedPermissions.includes(module.name))
                                    .map((module) => {
                                      const IconComponent = module.icon || Settings;
                                      return (
                                        <div 
                                          key={`available-${module.id}`}
                                          className="flex items-center gap-3 p-2 bg-white rounded border hover:border-blue-300 transition-colors cursor-pointer group"
                                          onClick={() => {
                                            setSelectedPermissions(prev => [...prev, module.name]);
                                          }}
                                        >
                                          <div className={`p-1.5 rounded ${module.color || 'bg-gray-500'} text-white`}>
                                            <IconComponent className="h-3 w-3" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="text-sm font-medium">{module.displayName}</div>
                                            <div className="text-xs text-gray-500">{module.name}</div>
                                          </div>
                                          <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                      );
                                    })}
                                </div>
                                {availableModules.filter(m => !selectedPermissions.includes(m.name)).length === 0 && (
                                  <div className="text-center text-gray-500 py-8">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">All modules assigned</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Assigned Modules Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <h3 className="font-medium text-green-800">Assigned Modules</h3>
                                <Badge variant="secondary" className="ml-auto">
                                  {selectedPermissions.length}
                                </Badge>
                              </div>
                              
                              <div className="max-h-80 overflow-y-auto p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                                <div className="space-y-2">
                                  {selectedPermissions.map((permissionName) => {
                                    const module = availableModules.find(m => m.name === permissionName);
                                    if (!module) return null;
                                    
                                    const IconComponent = module.icon || Settings;
                                    return (
                                      <div 
                                        key={`assigned-${module.id}`}
                                        className="flex items-center gap-3 p-2 bg-white rounded border hover:border-red-300 transition-colors cursor-pointer group"
                                        onClick={() => {
                                          setSelectedPermissions(prev => prev.filter(p => p !== module.name));
                                        }}
                                      >
                                        <div className={`p-1.5 rounded ${module.color || 'bg-gray-500'} text-white`}>
                                          <IconComponent className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{module.displayName}</div>
                                          <div className="text-xs text-gray-500">{module.name}</div>
                                        </div>
                                        {module.isCore && (
                                          <Crown className="h-3 w-3 text-yellow-500" />
                                        )}
                                        <X className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                      </div>
                                    );
                                  })}
                                </div>
                                {selectedPermissions.length === 0 && (
                                  <div className="text-center text-gray-500 py-8">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No modules assigned</p>
                                    <p className="text-xs mt-1">Click modules from Available list to assign</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const coreModules = availableModules.filter(m => m.isCore).map(m => m.name);
                                  setSelectedPermissions(coreModules);
                                }}
                                className="text-xs"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Assign Core Only
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPermissions(availableModules.map(m => m.name));
                                }}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Assign All
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPermissions([])}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear All
                            </Button>
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
                          <Badge variant="outline">{role.permissionCount || role.permissions?.length || 0}</Badge>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    ماژول‌های سیستم و دسترسی‌ها
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    مدیریت دسترسی کاربران به ماژول‌های مختلف سیستم
                  </p>
                </div>
                <Button
                  onClick={() => syncModulesMutation.mutate()}
                  disabled={syncModulesMutation.isPending}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className={`h-4 w-4 ${syncModulesMutation.isPending ? 'animate-spin' : ''}`} />
                  همگام‌سازی ماژول‌ها
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Display total count of modules */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Site Management Modules</h3>
                    <p className="text-blue-600 text-sm">مجموع ماژول‌های قابل تخصیص برای کاربران</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-800">{availableModules.length}</div>
                    <div className="text-sm text-blue-600">کل ماژول‌ها</div>
                  </div>
                </div>
              </div>

              {/* Display all modules in a simple grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {availableModules.map((module) => {
                  const IconComponent = module.icon || Settings;
                  return (
                    <div key={module.id} className="flex items-center space-x-3 p-3 bg-white rounded border hover:shadow-sm transition-all">
                      <span className="text-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{module.displayName}</div>
                        <div className="text-xs text-gray-500">{module.name}</div>
                      </div>
                      <Checkbox 
                        disabled
                        className="opacity-50"
                        title="تخصیص دسترسی از طریق مدیریت نقش‌ها امکان‌پذیر است"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Note about permission assignment */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600">💡</div>
                  <div>
                    <h4 className="font-medium text-yellow-800">نحوه تخصیص دسترسی‌ها</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      برای تخصیص این ماژول‌ها به کاربران، به بخش "نقش‌ها" بروید و نقش‌هایی با دسترسی‌های خاص ایجاد یا ویرایش کنید. 
                      سپس هر کاربر را می‌توانید به نقشی تخصیص دهید که دسترسی او به این {availableModules.length} ماژول را تعیین می‌کند.
                    </p>
                  </div>
                </div>
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

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setPasswordDialogOpen(false);
                setNewPassword('');
                setPasswordUserId(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newPassword && passwordUserId) {
                    changePasswordMutation.mutate({ userId: passwordUserId, newPassword });
                  }
                }}
                disabled={changePasswordMutation.isPending || !newPassword}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;