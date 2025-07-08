import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, TestTube, Truck, Box, CreditCard, Wallet, MapPin, Barcode, CheckCircle, GripVertical, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define the structure for Quick Action buttons
interface QuickActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className: string;
}

export default function SiteManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initial button configuration
  const getInitialButtons = (): QuickActionButton[] => [
    {
      id: "inquiries",
      label: "Inquiries",
      icon: BarChart3,
      onClick: () => setLocation("/admin/inquiries"),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50"
    },
    {
      id: "barcode",
      label: "Barcode",
      icon: QrCode,
      onClick: () => setLocation("/admin/barcode-inventory"),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50"
    },
    {
      id: "email-settings",
      label: "Email Settings",
      icon: Mail,
      onClick: () => setLocation("/admin/advanced-email-settings"),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
    },
    {
      id: "database-backup",
      label: "Database Backup",
      icon: Database,
      onClick: () => setLocation("/admin/database-management"),
      className: "border-slate-300 text-slate-600 hover:bg-slate-50"
    },
    {
      id: "crm",
      label: "CRM",
      icon: Users,
      onClick: () => setLocation("/crm"),
      className: "border-pink-300 text-pink-600 hover:bg-pink-50"
    },
    {
      id: "seo",
      label: "SEO",
      icon: Globe,
      onClick: () => setLocation("/seo-management"),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50"
    },
    {
      id: "categories",
      label: "Categories",
      icon: Package,
      onClick: () => setLocation("/category-management"),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50"
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      onClick: () => setLocation("/admin/sms-management"),
      className: "border-green-300 text-green-600 hover:bg-green-50"
    },
    {
      id: "factory",
      label: "Factory",
      icon: Factory,
      onClick: () => setLocation("/admin/factory-management"),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50"
    },
    {
      id: "super-admin",
      label: "Super Admin",
      icon: UserCog,
      onClick: () => setLocation("/super-admin/settings"),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50"
    },
    {
      id: "user-management",
      label: "User Management",
      icon: Users2,
      onClick: () => setLocation("/admin/user-management"),
      className: "border-red-300 text-red-600 hover:bg-red-50"
    },
    {
      id: "shop",
      label: "Shop",
      icon: DollarSign,
      onClick: () => setLocation("/shop-admin"),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50"
    },
    {
      id: "procedures",
      label: "Procedures",
      icon: BookOpen,
      onClick: () => setLocation("/admin/procedures-management"),
      className: "border-amber-300 text-amber-600 hover:bg-amber-50"
    },
    {
      id: "smtp-test",
      label: "SMTP Test",
      icon: TestTube,
      onClick: () => setLocation("/admin/smtp-test"),
      className: "border-sky-300 text-sky-600 hover:bg-sky-50"
    },
    {
      id: "order-management",
      label: "Order Management",
      icon: Truck,
      onClick: () => setLocation("/admin/order-management"),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50"
    },
    {
      id: "products",
      label: "Products",
      icon: Box,
      onClick: () => setLocation("/admin/products"),
      className: "border-violet-300 text-violet-600 hover:bg-violet-50"
    },
    {
      id: "payment-settings",
      label: "Payment Settings",
      icon: CreditCard,
      onClick: () => setLocation("/admin/payment-settings"),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
    },
    {
      id: "wallet-management",
      label: "Wallet Management",
      icon: Wallet,
      onClick: () => setLocation("/admin/wallet-management"),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50"
    },
    {
      id: "geography-analytics",
      label: "Geography Analytics",
      icon: MapPin,
      onClick: () => setLocation("/admin/geographic-analytics"),
      className: "border-teal-300 text-teal-600 hover:bg-teal-50"
    },
    {
      id: "ai-settings",
      label: "AI Settings",
      icon: Zap,
      onClick: () => setLocation("/admin/ai-settings"),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50"
    },
    {
      id: "refresh-control",
      label: "Refresh Control",
      icon: RefreshCw,
      onClick: () => setLocation("/admin/global-refresh-settings"),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50"
    },
    {
      id: "department-users",
      label: "Department Users",
      icon: Users,
      onClick: () => setLocation("/admin/department-users"),
      className: "border-teal-300 text-teal-600 hover:bg-teal-50"
    },
    {
      id: "inventory-management",
      label: "Inventory Management",
      icon: Package,
      onClick: () => setLocation("/admin/inventory-management"),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50"
    },
    {
      id: "content-management",
      label: "Content Management",
      icon: Edit3,
      onClick: () => setLocation("/admin/content-management"),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
    },
    {
      id: "customer-communications",
      label: "Customer Communications",
      icon: MessageSquare,
      onClick: () => setLocation("/admin/customer-communications"),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50"
    },
    {
      id: "security-management",
      label: "Security Management",
      icon: Shield,
      onClick: () => setLocation("/admin/security-management"),
      className: "border-red-300 text-red-600 hover:bg-red-50"
    }
  ];

  // State for managing button order with improved persistence
  const [buttons, setButtons] = useState<QuickActionButton[]>(() => {
    try {
      const savedOrder = localStorage.getItem('site-management-button-order');
      console.log('🔄 Loading button order from localStorage:', savedOrder);
      
      if (savedOrder) {
        const buttonIds = JSON.parse(savedOrder);
        console.log('📦 Parsed button IDs:', buttonIds);
        
        if (Array.isArray(buttonIds) && buttonIds.length > 0) {
          const initialButtons = getInitialButtons();
          console.log('🎯 Initial buttons count:', initialButtons.length);
          
          // Create a map for faster lookup
          const buttonMap = new Map(initialButtons.map(btn => [btn.id, btn]));
          
          // Reconstruct ordered buttons preserving saved order
          const orderedButtons = buttonIds
            .map((id: string) => buttonMap.get(id))
            .filter(Boolean) as QuickActionButton[];
          
          console.log('✅ Ordered buttons count:', orderedButtons.length);
          
          // Add any new buttons that might not be in saved order
          const existingIds = new Set(buttonIds);
          const newButtons = initialButtons.filter(btn => !existingIds.has(btn.id));
          console.log('🆕 New buttons count:', newButtons.length);
          
          const finalOrder = [...orderedButtons, ...newButtons];
          console.log('🎯 Final button order restored:', finalOrder.map(btn => btn.id));
          
          return finalOrder;
        }
      }
    } catch (error) {
      console.error('❌ Error loading button order:', error);
    }
    
    console.log('🔧 No valid saved order found, using default');
    return getInitialButtons();
  });

  // Enhanced localStorage persistence with debouncing
  useEffect(() => {
    if (buttons.length > 0) {
      const buttonIds = buttons.map(btn => btn.id);
      console.log('💾 Saving button order to localStorage:', buttonIds);
      
      try {
        localStorage.setItem('site-management-button-order', JSON.stringify(buttonIds));
        console.log('✅ Button order saved successfully');
        
        // Verify save was successful
        const verification = localStorage.getItem('site-management-button-order');
        if (verification) {
          const verified = JSON.parse(verification);
          console.log('🔍 Verification - saved order:', verified);
        }
      } catch (error) {
        console.error('❌ Error saving button order:', error);
      }
    }
  }, [buttons]);

  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const newButtons = Array.from(buttons);
    const [reorderedButton] = newButtons.splice(result.source.index, 1);
    newButtons.splice(result.destination.index, 0, reorderedButton);

    setButtons(newButtons);
    
    toast({
      title: "ترتیب به‌روزرسانی شد",
      description: "ترتیب بلوک‌های مدیریتی با موفقیت ذخیره شد",
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
                <CardTitle className="flex items-center justify-between">
                  <span>Quick Actions</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Resetting button order to default');
                      
                      // Clear localStorage
                      localStorage.removeItem('site-management-button-order');
                      console.log('🗑️ Cleared localStorage order data');
                      
                      // Reset to initial buttons
                      const defaultButtons = getInitialButtons();
                      setButtons(defaultButtons);
                      console.log('✅ Reset to default order:', defaultButtons.map(btn => btn.id));
                      
                      toast({
                        title: "ترتیب بازنشانی شد",
                        description: "ترتیب بلوک‌های مدیریتی به حالت اولیه بازگشت",
                      });
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Order
                  </Button>
                </CardTitle>
                <CardDescription>
                  Drag and drop administrative blocks to rearrange them as desired. Your custom order is automatically saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="quick-actions" direction="horizontal">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="quick-actions-grid"
                      >
                        {buttons.map((button, index) => {
                          const IconComponent = button.icon;
                          return (
                            <Draggable key={button.id} draggableId={button.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="relative drag-handle-parent group"
                                >
                                  <Button 
                                    variant="outline" 
                                    className={`h-20 w-full flex flex-col items-center justify-center ${button.className} transition-all duration-200 ${
                                      snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 bg-white dark:bg-gray-800' : 'hover:scale-102'
                                    }`}
                                    onClick={button.onClick}
                                    disabled={button.id === "sync-shop" && syncProductsMutation.isPending}
                                  >
                                    <IconComponent className={`h-6 w-6 mb-2 ${
                                      button.id === "sync-shop" && syncProductsMutation.isPending ? 'animate-spin' : ''
                                    }`} />
                                    <span className="text-sm">
                                      {button.id === "sync-shop" && syncProductsMutation.isPending ? 'Syncing...' : button.label}
                                    </span>
                                  </Button>
                                  
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-1 right-1 p-1 rounded bg-gray-100 dark:bg-gray-700 drag-handle cursor-grab active:cursor-grabbing hover:bg-gray-200 dark:hover:bg-gray-600"
                                  >
                                    <GripVertical className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
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