import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, TestTube, Truck, Box, CreditCard, Wallet, MapPin, Barcode, CheckCircle, GripVertical, Edit3, Calculator, Ticket, ShoppingCart, Warehouse, Smartphone, Server } from "lucide-react";
import { KardexSyncPanel } from "@/components/KardexSyncPanel";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Define the structure for Quick Action buttons
interface QuickActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className: string;
  moduleId?: string; // Optional module ID for role-based access control
}

export default function SiteManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showKardexSync, setShowKardexSync] = useState(false);
  const [buttons, setButtons] = useState<QuickActionButton[]>([]);



  // Function to track button clicks and sort by usage
  const trackButtonClick = (buttonId: string, action: () => void) => {
    // Get current click counts from localStorage
    const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
    
    // Increment click count for this button
    clickCounts[buttonId] = (clickCounts[buttonId] || 0) + 1;
    
    // Save updated counts
    localStorage.setItem('site-management-click-counts', JSON.stringify(clickCounts));
    
    // Execute the original action
    action();
    
    // Re-sort buttons based on new usage data
    setTimeout(() => {
      const updatedButtons = sortButtonsByUsage(getInitialButtons());
      setButtons(updatedButtons);
    }, 100);
  };

  // Function to sort buttons by usage frequency
  const sortButtonsByUsage = (initialButtons: QuickActionButton[]): QuickActionButton[] => {
    const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
    
    return [...initialButtons].sort((a, b) => {
      const aClicks = clickCounts[a.id] || 0;
      const bClicks = clickCounts[b.id] || 0;
      return bClicks - aClicks; // Sort in descending order (most clicked first)
    });
  };

  // Fetch user permissions to filter available modules
  const { data: userPermissions, isLoading: isLoadingPermissions, error: permissionsError } = useQuery({
    queryKey: ['/api/user/permissions'],
    staleTime: 0, // Force fresh data
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch active users data - removed automatic refresh
  const { data: activeUsersData, isLoading: isLoadingActiveUsers, refetch: refetchActiveUsers, error } = useQuery({
    queryKey: ['/api/active-users'],
    enabled: false, // Don't auto-fetch on mount
  });

  // Authentication check - redirect to login if not authenticated
  useEffect(() => {
    // Give more time for authentication to load after login
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        console.log("Not authenticated, redirecting to admin login");
        setLocation("/admin/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, setLocation]);

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading Site Management...</p>
        </div>
      </div>
    );
  }

  // Module ID to button mapping for role-based filtering
  const moduleButtonMap: Record<string, string> = {
    'server-config': 'server_config',
    'shop': 'shop',
    'products': 'products', 
    'order-management': 'order-management',
    'inventory-management': 'inventory-management',
    'crm': 'crm',
    'wallet-management': 'wallet-management',
    'payment-settings': 'payment-settings',
    'geography-analytics': 'geography-analytics',
    'finance-orders': 'order-management',
    'warehouse-orders': 'order-management',
    'logistics-orders': 'order-management',
    'email-settings': 'email-settings',
    'content-management': 'content-management',
    'seo': 'seo',
    'categories': 'categories',
    'barcode': 'barcode',
    'database-backup': 'database-backup',

    'ai-settings': 'ai-settings',
    'user-management': 'user-management',
    'security-management': 'security-management',
    'sms': 'sms',
    'factory': 'factory',
    'procedures': 'procedures'
  };

  // Initial button configuration ordered by most frequent usage (top-left priority)
  const getInitialButtons = (): QuickActionButton[] => [
    // Row 1: Most frequently used daily operations
    {
      id: "kardex-sync",
      label: "Syncing Shop",
      icon: Database,
      onClick: () => trackButtonClick("kardex-sync", () => setShowKardexSync(true)),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50",
      moduleId: "syncing_shop"
    },
    {
      id: "shop",
      label: "Shop",
      icon: DollarSign,
      onClick: () => trackButtonClick("shop", () => setLocation("/admin/shop")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "shop_management"
    },
    {
      id: "abandoned-cart",
      label: "Abandoned Cart",
      icon: ShoppingCart,
      onClick: () => trackButtonClick("abandoned-cart", () => setLocation("/admin/abandoned-cart-management")),
      className: "border-red-300 text-red-600 hover:bg-red-50",
      moduleId: "shop_management"
    },
    {
      id: "products",
      label: "Products", 
      icon: Box,
      onClick: () => trackButtonClick("products", () => setLocation("/admin/products")),
      className: "border-violet-300 text-violet-600 hover:bg-violet-50",
      moduleId: "product_management"
    },
    {
      id: "order-management",
      label: "Order Management",
      icon: Truck,
      onClick: () => trackButtonClick("order-management", () => setLocation("/admin/finance-orders")),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50",
      moduleId: "order_management"
    },
    {
      id: "warehouse-management",
      label: "Warehouse Management",
      icon: Warehouse,
      onClick: () => trackButtonClick("warehouse-management", () => setLocation("/admin/warehouse-management")),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50",
      moduleId: "warehouse_management"
    },
    {
      id: "inquiries",
      label: "Inquiries",
      icon: BarChart3,
      onClick: () => trackButtonClick("inquiries", () => setLocation("/admin/inquiries")),
      className: "border-amber-300 text-amber-600 hover:bg-amber-50",
      moduleId: "inquiries"
    },
    {
      id: "crm",
      label: "CRM",
      icon: Users,
      onClick: () => trackButtonClick("crm", () => setLocation("/crm")),
      className: "border-pink-300 text-pink-600 hover:bg-pink-50",
      moduleId: "crm"
    },
    {
      id: "barcode",
      label: "Barcode",
      icon: QrCode,
      onClick: () => trackButtonClick("barcode", () => setLocation("/admin/barcode-inventory")),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50",
      moduleId: "barcode"
    },
    {
      id: "batch-management",
      label: "Batch Management",
      icon: Package,
      onClick: () => trackButtonClick("batch-management", () => setLocation("/admin/batch-management")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "warehouse_management"
    },
    {
      id: "email-settings",
      label: "Email Settings",
      icon: Mail,
      onClick: () => trackButtonClick("email-settings", () => setLocation("/admin/advanced-email-settings")),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50",
      moduleId: "email_settings"
    },
    {
      id: "database-backup",
      label: "Database Backup",
      icon: Database,
      onClick: () => trackButtonClick("database-backup", () => setLocation("/admin/database-management")),
      className: "border-slate-300 text-slate-600 hover:bg-slate-50",
      moduleId: "database_backup"
    },
    {
      id: "server-config",
      label: "Server Config",
      icon: Server,
      onClick: () => trackButtonClick("server-config", () => setLocation("/admin/server-config")),
      className: "border-gray-300 text-gray-600 hover:bg-gray-50",
      moduleId: "server_config"
    },
    {
      id: "seo",
      label: "SEO",
      icon: Globe,
      onClick: () => trackButtonClick("seo", () => setLocation("/seo-management")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "seo"
    },
    {
      id: "categories",
      label: "Categories",
      icon: Package,
      onClick: () => trackButtonClick("categories", () => setLocation("/category-management")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50",
      moduleId: "categories"
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      onClick: () => trackButtonClick("sms", () => setLocation("/admin/sms-management")),
      className: "border-green-300 text-green-600 hover:bg-green-50",
      moduleId: "sms"
    },
    {
      id: "factory",
      label: "Factory",
      icon: Factory,
      onClick: () => trackButtonClick("factory", () => setLocation("/admin/factory-management")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "factory"
    },

    {
      id: "user-management",
      label: "User Management",
      icon: Users2,
      onClick: () => trackButtonClick("user-management", () => setLocation("/admin/user-management")),
      className: "border-red-300 text-red-600 hover:bg-red-50",
      moduleId: "user_management"
    },
    {
      id: "procedures",
      label: "Procedures",
      icon: BookOpen,
      onClick: () => trackButtonClick("procedures", () => setLocation("/admin/procedures-management")),
      className: "border-amber-300 text-amber-600 hover:bg-amber-50",
      moduleId: "procedures"
    },
    {
      id: "payment-settings",
      label: "Payment Settings",
      icon: CreditCard,
      onClick: () => trackButtonClick("payment-settings", () => setLocation("/admin/payment-settings")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50",
      moduleId: "payment_management"
    },
    {
      id: "wallet-management",
      label: "Wallet Management",
      icon: Wallet,
      onClick: () => trackButtonClick("wallet-management", () => setLocation("/admin/wallet-management")),
      className: "border-yellow-300 text-yellow-600 hover:bg-yellow-50",
      moduleId: "wallet_management"
    },
    {
      id: "geography-analytics", 
      label: "Geography Analytics",
      icon: MapPin,
      onClick: () => trackButtonClick("geography-analytics", () => setLocation("/admin/geographic-analytics")),
      className: "border-teal-300 text-teal-600 hover:bg-teal-50",
      moduleId: "geography_analytics"
    },
    {
      id: "ai-settings",
      label: "AI Settings",
      icon: Zap,
      onClick: () => trackButtonClick("ai-settings", () => setLocation("/admin/ai-settings")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "ai_settings"
    },
    {
      id: "refresh-control",
      label: "Refresh Control",
      icon: RefreshCw,
      onClick: () => trackButtonClick("refresh-control", () => setLocation("/admin/global-refresh-settings")),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50",
      moduleId: "refresh_control"
    },

    {
      id: "content-management",
      label: "Content Management",
      icon: Edit3,
      onClick: () => trackButtonClick("content-management", () => setLocation("/content-management")),
      className: "border-green-300 text-green-600 hover:bg-green-50",
      moduleId: "content_management"
    },
    {
      id: "logistics-management",
      label: "Logistics Management",
      icon: Truck,
      onClick: () => trackButtonClick("logistics-management", () => setLocation("/admin/logistics-management")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50",
      moduleId: "logistics_management"
    },
    {
      id: "ticketing-system",
      label: "Ticketing System",
      icon: Ticket,
      onClick: () => trackButtonClick("ticketing-system", () => setLocation("/admin/ticketing-system")),
      className: "border-rose-300 text-rose-600 hover:bg-rose-50",
      moduleId: "ticketing_system"
    },
    {
      id: "remote-desktop",
      label: "Remote Desktop",
      icon: Monitor,
      onClick: () => trackButtonClick("remote-desktop", () => setLocation("/admin/remote-desktop")),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50",
      moduleId: "remote_desktop"
    },


  ];

  // Filter buttons based on user permissions
  const getFilteredButtons = () => {
    // Don't show any buttons until permissions are loaded to prevent flashing all buttons
    if (isLoadingPermissions || !userPermissions?.success) return [];
    
    // Debug: Log permissions response
    console.log('🔍 [DEBUG] userPermissions:', userPermissions);
    console.log('🔍 [DEBUG] permissions array:', userPermissions.permissions);
    
    const allowedModules = userPermissions.permissions?.map((p: any) => p.moduleId) || [];
    console.log('🔍 [DEBUG] allowedModules:', allowedModules);
    
    const allButtons = getInitialButtons();
    console.log('🔍 [DEBUG] total buttons:', allButtons.length);
    
    // If no moduleId specified, show button (for universal access buttons)
    // If moduleId specified, check if user has access to that module
    const filteredButtons = allButtons.filter(button => 
      !button.moduleId || allowedModules.includes(button.moduleId)
    );
    
    console.log('🔍 [DEBUG] total buttons defined:', allButtons.length);
    console.log('🔍 [DEBUG] filtered buttons count:', filteredButtons.length);
    console.log('🔍 [DEBUG] all button moduleIds:', allButtons.map(b => b.moduleId).filter(Boolean).sort());
    console.log('🔍 [DEBUG] allowed modules:', allowedModules.sort());
    console.log('🔍 [DEBUG] missing buttons (not in permissions):', allButtons.filter(btn => 
      btn.moduleId && !allowedModules.includes(btn.moduleId)
    ).map(b => ({ id: b.id, moduleId: b.moduleId })));
    console.log('🔍 [DEBUG] buttons without moduleId:', allButtons.filter(btn => !btn.moduleId).map(b => b.id));
    return filteredButtons;
  };



  // Update buttons when permissions change
  useEffect(() => {
    if (userPermissions?.success) {
      const filteredButtons = getFilteredButtons();
      const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
      const savedOrder = localStorage.getItem('site-management-button-order');
      
      // First try to restore saved order if available
      if (savedOrder) {
        try {
          const savedButtonIds = JSON.parse(savedOrder);
          // Only include buttons that are authorized for this user
          const orderedButtons = savedButtonIds
            .map((id: string) => filteredButtons.find(btn => btn.id === id))
            .filter((btn: QuickActionButton | undefined): btn is QuickActionButton => btn !== undefined);
          
          // Add any new authorized buttons that weren't in the saved order
          const savedIds = new Set(savedButtonIds);
          const newButtons = filteredButtons.filter(btn => !savedIds.has(btn.id));
          
          setButtons([...orderedButtons, ...newButtons]);
          return;
        } catch {
          // If parsing fails, fall back to default behavior
        }
      }
      
      // Apply usage-based sorting if available, otherwise use filtered buttons
      if (Object.keys(clickCounts).length > 0) {
        setButtons(sortButtonsByUsage(filteredButtons));
      } else {
        setButtons(filteredButtons);
      }
    }
  }, [userPermissions]);

  // Save button order to localStorage whenever it changes
  useEffect(() => {
    const buttonIds = buttons.map(btn => btn.id);
    localStorage.setItem('site-management-button-order', JSON.stringify(buttonIds));
  }, [buttons]);

  // Handle drag end
  const handleOnDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(buttons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setButtons(items);
    
    toast({
      title: "ترتیب تغییر کرد",
      description: "ترتیب جدید ذخیره شد",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {user?.id === 1 && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Site Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive website management and configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
                const sorted = Object.entries(clickCounts)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 5);
                
                toast({
                  title: "پرکاربردترین ابزارها",
                  description: sorted.length ? sorted.map(([id, count]) => `${id}: ${count} کلیک`).join('\n') : "هنوز آماری ثبت نشده",
                });
              }}
              className="text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              آمار استفاده
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('site-management-click-counts');
                setButtons(getInitialButtons());
                toast({
                  title: "آمار بازنشانی شد",
                  description: "ترتیب بلوک‌ها به حالت پیش‌فرض بازگشت",
                });
              }}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              بازنشانی آمار
            </Button>
          </div>
        </div>



        {/* Overview Content */}
        <div className="space-y-6">
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

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => refetchActiveUsers()}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingActiveUsers ? (
                    <div className="animate-pulse bg-gray-200 rounded w-8 h-8"></div>
                  ) : error ? (
                    "Login required"
                  ) : (
                    activeUsersData?.data?.activeUsersCount || "Click to check"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {error ? "Login as admin first" : activeUsersData?.data ? "Currently online (last 30 min)" : "Click to get exact count"}
                </p>
                {activeUsersData?.data?.activeUsers && activeUsersData.data.activeUsers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {activeUsersData.data.activeUsers.slice(0, 3).map((user: any, index: number) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {user.username || `User ${user.id || 'Anonymous'}`}
                      </div>
                    ))}
                    {activeUsersData.data.activeUsers.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{activeUsersData.data.activeUsers.length - 3} more
                      </div>
                    )}
                  </div>
                )}
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
                    localStorage.removeItem('site-management-button-order');
                    localStorage.removeItem('site-management-click-counts');
                    
                    // Reset to filtered buttons (respecting permissions) instead of all buttons
                    const authorizedButtons = getFilteredButtons();
                    setButtons(authorizedButtons);
                    
                    toast({
                      title: "ترتیب بازنشانی شد",
                      description: "ترتیب بلوک‌های مدیریتی به حالت اولیه بازگشت",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Order
                </Button>
              </CardTitle>
              <CardDescription>
                Drag and drop to reorder management blocks. Your custom layout will be saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="buttons-grid">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                      {isLoadingPermissions ? (
                        // Loading skeleton for buttons
                        Array.from({ length: 6 }).map((_, index) => (
                          <div key={`skeleton-${index}`} className="animate-pulse">
                            <Card className="border-2">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                  </div>
                                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      ) : (
                        buttons.map((button, index) => {
                          const IconComponent = button.icon;
                        return (
                          <Draggable key={button.id} draggableId={button.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${snapshot.isDragging ? 'rotate-6 scale-105 shadow-lg' : ''} transition-all duration-200`}
                              >
                                <Card 
                                  className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${button.className} ${snapshot.isDragging ? 'shadow-xl border-blue-400' : ''}`}
                                  onClick={button.onClick}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <IconComponent className="w-6 h-6" />
                                        <span className="font-medium text-sm">{button.label}</span>
                                      </div>
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kardex Sync Dialog */}
      <Dialog open={showKardexSync} onOpenChange={setShowKardexSync}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              سیستم همگام‌سازی کاردکس
            </DialogTitle>
          </DialogHeader>
          <KardexSyncPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}