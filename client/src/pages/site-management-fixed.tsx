import React, { useState, useEffect, startTransition } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, Truck, Box, CreditCard, Wallet, MapPin, Barcode, CheckCircle, GripVertical, Edit3, Calculator, Ticket, ShoppingCart, Warehouse, Smartphone, Brain, Monitor as RemoteMonitor, FileText, Edit, Server, MessageCircle, Cloud } from "lucide-react";
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
  console.log('🔍 [DEBUG] Site Management component initialized');
  
  // All hooks at the top - never conditional
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showKardexSync, setShowKardexSync] = useState(false);
  const [buttons, setButtons] = useState<QuickActionButton[]>([]);

  // All useQuery hooks - never conditional
  const { data: userPermissions, isLoading: isLoadingPermissions, error: permissionsError, refetch: refetchPermissions } = useQuery({
    queryKey: ['/api/user/permissions'], // Remove timestamp to prevent infinite re-renders
    staleTime: 30000, // Cache for 30 seconds
    retry: 3,
    retryDelay: 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled: isAuthenticated, // Only run when authenticated
  });

  const { data: activeUsersData, isLoading: isLoadingActiveUsers, refetch: refetchActiveUsers, error } = useQuery({
    queryKey: ['/api/active-users'],
    enabled: false,
  });

  // All useEffect hooks - never conditional
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        console.log("Not authenticated, redirecting to admin login");
        setLocation("/admin/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    // Clear cache and refetch permissions on mount (only once)
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['/api/user/permissions'] });
      refetchPermissions();
    }
  }, [isAuthenticated]); // Only depend on authentication status

  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect triggered, userPermissions:', userPermissions);
    if (userPermissions && typeof userPermissions === 'object' && 'success' in userPermissions && userPermissions.success) {
      startTransition(() => {
        console.log('🔍 [DEBUG] userPermissions modules:', (userPermissions as any).modules);
        const filteredButtons = getFilteredButtons();
        console.log('🔍 [DEBUG] filtered buttons count:', filteredButtons.length);
        console.log('🔍 [DEBUG] First 5 filtered buttons:', filteredButtons.slice(0, 5).map(b => ({ id: b.id, label: b.label, moduleId: b.moduleId })));
        console.log('🔍 [DEBUG] AI Control button in filtered:', filteredButtons.find(b => b.id === 'ai-settings'));
        console.log('🔍 [DEBUG] Content Management button in filtered:', filteredButtons.find(b => b.id === 'content-management'));
        const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
        const savedOrder = localStorage.getItem('site-management-button-order');
        
        if (savedOrder) {
          try {
            const savedButtonIds = JSON.parse(savedOrder);
            const orderedButtons = savedButtonIds
              .map((id: string) => filteredButtons.find(btn => btn.id === id))
              .filter((btn: QuickActionButton | undefined): btn is QuickActionButton => btn !== undefined);
            
            const savedIds = new Set(savedButtonIds);
            const newButtons = filteredButtons.filter(btn => !savedIds.has(btn.id));
            
            setButtons([...orderedButtons, ...newButtons]);
            return;
          } catch {
            // If parsing fails, fall back to default behavior
          }
        }
        
        if (Object.keys(clickCounts).length > 0) {
          setButtons(sortButtonsByUsage(filteredButtons));
        } else {
          setButtons(filteredButtons);
        }
      });
    }
  }, [userPermissions]);

  useEffect(() => {
    if (buttons.length > 0) {
      const buttonIds = buttons.map(btn => btn.id);
      localStorage.setItem('site-management-button-order', JSON.stringify(buttonIds));
    }
  }, [buttons]);

  // Helper functions
  const trackButtonClick = (buttonId: string, action: () => void) => {
    const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
    clickCounts[buttonId] = (clickCounts[buttonId] || 0) + 1;
    localStorage.setItem('site-management-click-counts', JSON.stringify(clickCounts));
    action();
    setTimeout(() => {
      const updatedButtons = sortButtonsByUsage(getInitialButtons());
      setButtons(updatedButtons);
    }, 100);
  };

  const sortButtonsByUsage = (initialButtons: QuickActionButton[]): QuickActionButton[] => {
    const clickCounts = JSON.parse(localStorage.getItem('site-management-click-counts') || '{}');
    return [...initialButtons].sort((a, b) => {
      const aClicks = clickCounts[a.id] || 0;
      const bClicks = clickCounts[b.id] || 0;
      return bClicks - aClicks;
    });
  };

  const getInitialButtons = (): QuickActionButton[] => [
    {
      id: "kpi-dashboard",
      label: "KPI Dashboard", 
      icon: BarChart3,
      onClick: () => trackButtonClick("kpi-dashboard", () => setLocation("/admin/kpi-dashboard")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-800",
      moduleId: "kpi_dashboard"
    },
    {
      id: "management-dashboard",
      label: "Management Dashboard",
      icon: Monitor,
      onClick: () => trackButtonClick("management-dashboard", () => setLocation("/admin/management-dashboard")),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800",
      moduleId: "management_dashboard"
    },
    {
      id: "kardex-sync",
      label: "Syncing Shop",
      icon: Database,
      onClick: () => trackButtonClick("kardex-sync", () => setShowKardexSync(true)),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-800",
      moduleId: "syncing_shop"
    },
    {
      id: "shop",
      label: "Shop",
      icon: DollarSign,
      onClick: () => trackButtonClick("shop", () => setLocation("/admin/shop")),
      className: "border-green-300 text-green-600 hover:bg-green-50 hover:text-green-800",
      moduleId: "shop_management"
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      onClick: () => trackButtonClick("products", () => setLocation("/admin/products")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-800",
      moduleId: "product_management"
    },
    {
      id: "order-management",
      label: "Order Management",
      icon: ShoppingCart,
      onClick: () => trackButtonClick("order-management", () => setLocation("/admin/order-management")),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-800",
      moduleId: "order_management"
    },
    {
      id: "warehouse-management",
      label: "Warehouse Management",
      icon: Warehouse,
      onClick: () => trackButtonClick("warehouse-management", () => setLocation("/admin/warehouse-management")),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800",
      moduleId: "warehouse_management"
    },


    {
      id: "crm",
      label: "CRM",
      icon: Users,
      onClick: () => trackButtonClick("crm", () => setLocation("/crm")),
      className: "border-pink-300 text-pink-600 hover:bg-pink-50 hover:text-pink-800",
      moduleId: "crm"
    },
    {
      id: "wallet-management",
      label: "Wallet Management",
      icon: Wallet,
      onClick: () => trackButtonClick("wallet-management", () => setLocation("/admin/wallet-management")),
      className: "border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-800",
      moduleId: "wallet_management"
    },

    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      onClick: () => trackButtonClick("finance", () => setLocation("/admin/finance-orders")),
      className: "border-green-300 text-green-600 hover:bg-green-50 hover:text-green-800",
      moduleId: "finance"
    },
    {
      id: "accounting-management",
      label: "Accounting Management",
      icon: Calculator,
      onClick: () => trackButtonClick("accounting-management", () => setLocation("/admin/accounting-management")),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800",
      moduleId: "accounting_management"
    },
    {
      id: "payment-settings",
      label: "Payment Settings",
      icon: CreditCard,
      onClick: () => trackButtonClick("payment-settings", () => setLocation("/admin/payment-settings")),
      className: "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-800",
      moduleId: "payment_management"
    },
    {
      id: "geography-analytics",
      label: "Geography Analytics",
      icon: MapPin,
      onClick: () => trackButtonClick("geography-analytics", () => setLocation("/admin/geographic-analytics")),
      className: "border-teal-300 text-teal-600 hover:bg-teal-50 hover:text-teal-800",
      moduleId: "geography_analytics"
    },
    {
      id: "inquiries",
      label: "Inquiries",
      icon: MessageSquare,
      onClick: () => trackButtonClick("inquiries", () => setLocation("/admin/inquiries")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-800",
      moduleId: "inquiries"
    },
    {
      id: "email-settings",
      label: "Email Settings",
      icon: Mail,
      onClick: () => trackButtonClick("email-settings", () => setLocation("/admin/advanced-email-settings")),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-800",
      moduleId: "email_settings"
    },
    {
      id: "content-management",
      label: "Content Management",
      icon: Edit3,
      onClick: () => trackButtonClick("content-management", () => setLocation("/content-management")),
      className: "border-lime-300 text-lime-600 hover:bg-lime-50 hover:text-lime-800",
      moduleId: "content_management"
    },
    {
      id: "company-information",
      label: "Company Information",
      icon: FileText,
      onClick: () => trackButtonClick("company-information", () => setLocation("/admin/company-information")),
      className: "border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
      moduleId: "company_information"
    },
    {
      id: "seo",
      label: "SEO Management",
      icon: Globe,
      onClick: () => trackButtonClick("seo", () => setLocation("/seo-management")),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800",
      moduleId: "seo"
    },
    {
      id: "categories",
      label: "Categories",
      icon: Box,
      onClick: () => trackButtonClick("categories", () => setLocation("/category-management")),
      className: "border-violet-300 text-violet-600 hover:bg-violet-50 hover:text-violet-800",
      moduleId: "categories"
    },
    {
      id: "barcode",
      label: "Barcode",
      icon: QrCode,
      onClick: () => trackButtonClick("barcode", () => setLocation("/admin/barcode-inventory")),
      className: "border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-800",
      moduleId: "barcode"
    },
    {
      id: "database-backup",
      label: "Database Backup",
      icon: Database,
      onClick: () => trackButtonClick("database-backup", () => setLocation("/admin/database-management")),
      className: "border-stone-300 text-stone-600 hover:bg-stone-50 hover:text-stone-800",
      moduleId: "database_backup"
    },
    {
      id: "user-management",
      label: "User Management",
      icon: UserCog,
      onClick: () => trackButtonClick("user-management", () => setLocation("/admin/user-management")),
      className: "border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
      moduleId: "user_management"
    },
    {
      id: "sms",
      label: "SMS Management",
      icon: Smartphone,
      onClick: () => trackButtonClick("sms", () => setLocation("/admin/sms-management")),
      className: "border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800",
      moduleId: "sms"
    },
    {
      id: "factory",
      label: "Factory Management",
      icon: Factory,
      onClick: () => trackButtonClick("factory", () => setLocation("/admin/factory-management")),
      className: "border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800",
      moduleId: "factory"
    },
    {
      id: "procedures",
      label: "Procedures",
      icon: BookOpen,
      onClick: () => trackButtonClick("procedures", () => setLocation("/admin/procedures-management")),
      className: "border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800",
      moduleId: "procedures"
    },
    {
      id: "refresh-control",
      label: "Refresh Control",
      icon: RefreshCw,
      onClick: () => trackButtonClick("refresh-control", () => setLocation("/admin/global-refresh-settings")),
      className: "border-green-300 text-green-600 hover:bg-green-50 hover:text-green-800",
      moduleId: "refresh_control"
    },
    {
      id: "logistics",
      label: "Logistics Management",
      icon: Truck,
      onClick: () => trackButtonClick("logistics", () => setLocation("/admin/logistics-management")),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-800",
      moduleId: "logistics_management"
    },
    {
      id: "ticketing",
      label: "Ticketing System",
      icon: Ticket,
      onClick: () => trackButtonClick("ticketing", () => setLocation("/admin/ticketing-system")),
      className: "border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-800",
      moduleId: "ticketing_system"
    },

    {
      id: "remote-desktop",
      label: "Remote Desktop",
      icon: RemoteMonitor,
      onClick: () => trackButtonClick("remote-desktop", () => setLocation("/admin/remote-desktop")),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-800",
      moduleId: "remote_desktop"
    },
    {
      id: "server-config",
      label: "Server Config",
      icon: Server,
      onClick: () => trackButtonClick("server-config", () => setLocation("/admin/server-config")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-800",
      moduleId: "server_config"
    },
    {
      id: "aws-s3-settings",
      label: "AWS S3 Settings",
      icon: Cloud,
      onClick: () => trackButtonClick("aws-s3-settings", () => setLocation("/admin/aws-s3-settings")),
      className: "border-sky-300 text-sky-600 hover:bg-sky-50 hover:text-sky-800",
      moduleId: "aws_s3_settings"
    },
    {
      id: "user-guide",
      label: "User Guide",
      icon: BookOpen,
      onClick: () => trackButtonClick("user-guide", () => setLocation("/user-guide")),
      className: "border-teal-300 text-teal-600 hover:bg-teal-50 hover:text-teal-800",
      moduleId: "user_guide"
    },
    {
      id: "marketing-module",
      label: "Marketing Module",
      icon: BarChart3,
      onClick: () => trackButtonClick("marketing-module", () => setLocation("/admin/marketing-module")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-800",
      moduleId: "marketing_module"
    },
    {
      id: "super-admin-order-management",
      label: "Super Admin Order Management",
      icon: Shield,
      onClick: () => trackButtonClick("super-admin-order-management", () => setLocation("/admin/super-admin-order-management")),
      className: "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-800 font-semibold",
      moduleId: "order_management"
    },
    {
      id: "whatsapp-crm",
      label: "WhatsApp CRM",
      icon: MessageCircle,
      onClick: () => trackButtonClick("whatsapp-crm", () => setLocation("/admin/whatsapp-crm")),
      className: "border-green-400 text-green-600 hover:bg-green-50 hover:text-green-800",
      moduleId: "whatsapp_crm"
    }

  ];

  const getFilteredButtons = () => {
    if (isLoadingPermissions || !userPermissions || typeof userPermissions !== 'object' || !('success' in userPermissions) || !userPermissions.success) return [];
    
    const permissions = userPermissions as any;
    console.log('🔍 [DEBUG] Full userPermissions response:', permissions);
    console.log('🔍 [DEBUG] userPermissions.modules:', permissions.modules);
    console.log('🔍 [DEBUG] userPermissions.permissions:', permissions.permissions);
    
    // Try both the modules array and permissions array for compatibility
    const allowedModules = permissions.modules || permissions.permissions?.map((p: any) => p.moduleId) || [];
    const allButtons = getInitialButtons();
    console.log('🔍 [DEBUG] Total allButtons count:', allButtons.length);
    console.log('🔍 [DEBUG] AI Settings exists in allButtons:', !!allButtons.find(b => b.id === 'ai-settings'));
    console.log('🔍 [DEBUG] Content Management exists in allButtons:', !!allButtons.find(b => b.id === 'content-management'));
    
    console.log('🔍 [DEBUG] allowedModules:', allowedModules);
    console.log('🔍 [DEBUG] kpi_dashboard in allowedModules?', allowedModules.includes('kpi_dashboard'));
    console.log('🔍 [DEBUG] management_dashboard in allowedModules?', allowedModules.includes('management_dashboard'));
    console.log('🔍 [DEBUG] finance in allowedModules?', allowedModules.includes('finance'));
    console.log('🔍 [DEBUG] geography_analytics in allowedModules?', allowedModules.includes('geography_analytics'));
    console.log('🔍 [DEBUG] ai_settings in allowedModules?', allowedModules.includes('ai_settings'));
    console.log('🔍 [DEBUG] content_management in allowedModules?', allowedModules.includes('content_management'));
    
    const filtered = allButtons.filter(button => 
      !button.moduleId || allowedModules.includes(button.moduleId)
    );
    
    console.log('🔍 [CRITICAL] Missing button detection:');
    const missingButtons = allButtons.filter(button => {
      const included = !button.moduleId || allowedModules.includes(button.moduleId);
      if (!included) {
        console.log('🔍 [MISSING]', button.id, button.label, 'moduleId:', button.moduleId);
      }
      return !included;
    });
    console.log('🔍 [CRITICAL] Missing buttons count:', missingButtons.length);
    
    console.log('🔍 [DEBUG] finance button found in allButtons?', allButtons.find(b => b.moduleId === 'finance'));
    console.log('🔍 [DEBUG] geography_analytics button found in allButtons?', allButtons.find(b => b.moduleId === 'geography_analytics'));
    console.log('🔍 [DEBUG] ai_settings button found in allButtons?', allButtons.find(b => b.moduleId === 'ai_settings'));
    console.log('🔍 [DEBUG] content_management button found in allButtons?', allButtons.find(b => b.moduleId === 'content_management'));
    console.log('🔍 [DEBUG] finance button in filtered?', filtered.find(b => b.moduleId === 'finance'));
    console.log('🔍 [DEBUG] geography_analytics button in filtered?', filtered.find(b => b.moduleId === 'geography_analytics'));
    console.log('🔍 [DEBUG] ai_settings button in filtered?', filtered.find(b => b.moduleId === 'ai_settings'));
    console.log('🔍 [DEBUG] content_management button in filtered?', filtered.find(b => b.moduleId === 'content_management'));
    
    return filtered;
  };

  const resetButtonOrder = () => {
    localStorage.removeItem('site-management-button-order');
    localStorage.removeItem('site-management-click-counts');
    const filteredButtons = getFilteredButtons();
    setButtons(filteredButtons);
    toast({ title: "Success", description: "Button order has been reset to default" });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(buttons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setButtons(items);
  };

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

  // Show not authenticated message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Site Management
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={resetButtonOrder}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Reset Order
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Welcome, {user?.username}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Quick Actions
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {buttons.length} modules available
            </div>
          </div>

          {isLoadingPermissions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading modules...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="quick-actions">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                  >
                    {buttons.map((button, index) => (
                      <Draggable key={button.id} draggableId={button.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
                          >
                            <Button
                              onClick={button.onClick}
                              variant="outline"
                              className={`w-full h-20 flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-105 ${button.className} ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-400' : ''}`}
                            >
                              <button.icon className="w-6 h-6" />
                              <span className="text-xs font-medium text-center leading-tight">
                                {button.label}
                              </span>
                            </Button>
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Card>

        {/* Kardex Sync Dialog */}
        <Dialog open={showKardexSync} onOpenChange={setShowKardexSync}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Syncing Shop</DialogTitle>
            </DialogHeader>
            <KardexSyncPanel />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}