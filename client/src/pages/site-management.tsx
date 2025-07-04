import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, TestTube, Truck, Box, CreditCard, Wallet, MapPin, Barcode, CheckCircle, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

// تعریف نوع داده برای هر بلوک
interface QuickActionBlock {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  colorClass: string;
  action?: () => void;
}

export default function SiteManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // آرایه اولیه بلوک‌ها
  const defaultBlocks: QuickActionBlock[] = [
    { id: "sync-shop", title: "Sync Shop", icon: <RefreshCw className="h-6 w-6 mb-2" />, path: "", colorClass: "border-green-300 text-green-600 hover:bg-green-50", action: () => syncProductsMutation.mutate() },
    { id: "inquiries", title: "Inquiries", icon: <BarChart3 className="h-6 w-6 mb-2" />, path: "/admin/inquiries", colorClass: "border-orange-300 text-orange-600 hover:bg-orange-50" },
    { id: "barcode", title: "Barcode", icon: <QrCode className="h-6 w-6 mb-2" />, path: "/admin/barcode-inventory", colorClass: "border-cyan-300 text-cyan-600 hover:bg-cyan-50" },
    { id: "email-settings", title: "Email Settings", icon: <Mail className="h-6 w-6 mb-2" />, path: "/admin/advanced-email-settings", colorClass: "border-emerald-300 text-emerald-600 hover:bg-emerald-50" },
    { id: "database-backup", title: "Database Backup", icon: <Database className="h-6 w-6 mb-2" />, path: "/admin/database-management", colorClass: "border-slate-300 text-slate-600 hover:bg-slate-50" },
    { id: "crm", title: "CRM", icon: <Users className="h-6 w-6 mb-2" />, path: "/crm", colorClass: "border-pink-300 text-pink-600 hover:bg-pink-50" },
    { id: "seo", title: "SEO", icon: <Globe className="h-6 w-6 mb-2" />, path: "/seo-management", colorClass: "border-purple-300 text-purple-600 hover:bg-purple-50" },
    { id: "categories", title: "Categories", icon: <Package className="h-6 w-6 mb-2" />, path: "/category-management", colorClass: "border-blue-300 text-blue-600 hover:bg-blue-50" },
    { id: "sms", title: "SMS", icon: <MessageSquare className="h-6 w-6 mb-2" />, path: "/admin/sms-management", colorClass: "border-green-300 text-green-600 hover:bg-green-50" },
    { id: "factory", title: "Factory", icon: <Factory className="h-6 w-6 mb-2" />, path: "/admin/factory-management", colorClass: "border-purple-300 text-purple-600 hover:bg-purple-50" },
    { id: "super-admin", title: "Super Admin", icon: <UserCog className="h-6 w-6 mb-2" />, path: "/super-admin/settings", colorClass: "border-indigo-300 text-indigo-600 hover:bg-indigo-50" },
    { id: "user-management", title: "User Management", icon: <Users2 className="h-6 w-6 mb-2" />, path: "/admin/user-management", colorClass: "border-red-300 text-red-600 hover:bg-red-50" },
    { id: "shop", title: "Shop", icon: <DollarSign className="h-6 w-6 mb-2" />, path: "/shop-admin", colorClass: "border-purple-300 text-purple-600 hover:bg-purple-50" },
    { id: "procedures", title: "Procedures", icon: <BookOpen className="h-6 w-6 mb-2" />, path: "/admin/procedures-management", colorClass: "border-amber-300 text-amber-600 hover:bg-amber-50" },
    { id: "smtp-test", title: "SMTP Test", icon: <TestTube className="h-6 w-6 mb-2" />, path: "/admin/smtp-test", colorClass: "border-sky-300 text-sky-600 hover:bg-sky-50" },
    { id: "order-management", title: "Order Management", icon: <Truck className="h-6 w-6 mb-2" />, path: "/admin/order-management", colorClass: "border-orange-300 text-orange-600 hover:bg-orange-50" },
    { id: "products", title: "Products", icon: <Box className="h-6 w-6 mb-2" />, path: "/admin/products", colorClass: "border-violet-300 text-violet-600 hover:bg-violet-50" },
    { id: "payment-settings", title: "Payment Settings", icon: <CreditCard className="h-6 w-6 mb-2" />, path: "/admin/payment-settings", colorClass: "border-emerald-300 text-emerald-600 hover:bg-emerald-50" },
    { id: "wallet-management", title: "Wallet Management", icon: <Wallet className="h-6 w-6 mb-2" />, path: "/admin/wallet-management", colorClass: "border-blue-300 text-blue-600 hover:bg-blue-50" },
    { id: "geography-analytics", title: "Geography Analytics", icon: <MapPin className="h-6 w-6 mb-2" />, path: "/admin/geographic-analytics", colorClass: "border-teal-300 text-teal-600 hover:bg-teal-50" },
    { id: "ai-settings", title: "AI Settings", icon: <Zap className="h-6 w-6 mb-2" />, path: "/admin/ai-settings", colorClass: "border-purple-300 text-purple-600 hover:bg-purple-50" },
    { id: "refresh-control", title: "Refresh Control", icon: <RefreshCw className="h-6 w-6 mb-2" />, path: "/admin/global-refresh-settings", colorClass: "border-indigo-300 text-indigo-600 hover:bg-indigo-50" },
    { id: "department-users", title: "Department Users", icon: <Users className="h-6 w-6 mb-2" />, path: "/admin/department-users", colorClass: "border-teal-300 text-teal-600 hover:bg-teal-50" },
  ];

  // State برای مدیریت ترتیب بلوک‌ها
  const [blocks, setBlocks] = useState<QuickActionBlock[]>(() => {
    const savedOrder = localStorage.getItem('siteManagementBlockOrder');
    if (savedOrder) {
      try {
        const savedIds = JSON.parse(savedOrder);
        // ترتیب بلوک‌ها بر اساس ترتیب ذخیره شده
        const orderedBlocks = savedIds.map((id: string) => 
          defaultBlocks.find(block => block.id === id)
        ).filter(Boolean);
        
        // اضافه کردن بلوک‌های جدید که در ترتیب ذخیره شده نیستند
        const missingBlocks = defaultBlocks.filter(block => 
          !savedIds.includes(block.id)
        );
        
        return [...orderedBlocks, ...missingBlocks];
      } catch {
        return defaultBlocks;
      }
    }
    return defaultBlocks;
  });

  // ذخیره ترتیب در localStorage
  const saveBlockOrder = (newBlocks: QuickActionBlock[]) => {
    const blockIds = newBlocks.map(block => block.id);
    localStorage.setItem('siteManagementBlockOrder', JSON.stringify(blockIds));
  };

  // مدیریت drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedBlocks = Array.from(blocks);
    const [reorderedBlock] = reorderedBlocks.splice(result.source.index, 1);
    reorderedBlocks.splice(result.destination.index, 0, reorderedBlock);

    setBlocks(reorderedBlocks);
    saveBlockOrder(reorderedBlocks);
    
    toast({
      title: "ترتیب بلوک‌ها ذخیره شد",
      description: "تغییرات شما در localStorage ذخیره شد",
      variant: "default"
    });
  };

  const syncProductsMutation = useMutation({
    mutationFn: () => apiRequest("/api/sync-products", "POST"),
    onSuccess: () => {
      toast({ title: "Success", description: "All products synchronized with shop successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sync products", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Site Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive website management and configuration
              </p>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Website Status</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <p className="text-xs text-muted-foreground">All services operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  Quick Actions - Drag to Reorder
                </CardTitle>
                <CardDescription>
                  Common site management tasks - بکشید و جابجا کنید تا ترتیب را بر اساس اولویت تنظیم کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="quick-actions">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      >
                        {blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging 
                                    ? provided.draggableProps.style?.transform 
                                    : "none",
                                }}
                              >
                                <Button 
                                  variant="outline" 
                                  className={`h-20 flex flex-col items-center justify-center ${block.colorClass} relative group transition-all duration-200 ${
                                    snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                  }`}
                                  onClick={() => {
                                    if (block.action) {
                                      block.action();
                                    } else {
                                      setLocation(block.path);
                                    }
                                  }}
                                  disabled={block.id === "sync-shop" && syncProductsMutation.isPending}
                                >
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <GripVertical className="h-3 w-3 text-gray-400" />
                                  </div>
                                  
                                  {block.id === "sync-shop" ? (
                                    <RefreshCw className={`h-6 w-6 mb-2 ${syncProductsMutation.isPending ? 'animate-spin' : ''}`} />
                                  ) : (
                                    block.icon
                                  )}
                                  
                                  <span className="text-sm">
                                    {block.id === "sync-shop" && syncProductsMutation.isPending 
                                      ? 'Syncing...' 
                                      : block.title
                                    }
                                  </span>
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  Manage website content, pages, and media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Content management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>
                  Monitor site performance and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Performance monitoring functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System settings functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}