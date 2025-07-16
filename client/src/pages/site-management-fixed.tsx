import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, TestTube, Truck, Box, CreditCard, Wallet, MapPin, Barcode, CheckCircle, GripVertical, Edit3, Calculator, Ticket, ShoppingCart, Warehouse, Smartphone, Brain } from "lucide-react";
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
    if (userPermissions?.success) {
      console.log('🔍 [DEBUG] userPermissions modules:', userPermissions.modules);
      const filteredButtons = getFilteredButtons();
      console.log('🔍 [DEBUG] filtered buttons count:', filteredButtons.length);
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
      className: "border-green-300 text-green-600 hover:bg-green-50",
      moduleId: "shop_management"
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      onClick: () => trackButtonClick("products", () => setLocation("/admin/products")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "product_management"
    },
    {
      id: "order-management",
      label: "Order Management",
      icon: ShoppingCart,
      onClick: () => trackButtonClick("order-management", () => setLocation("/admin/order-management")),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50",
      moduleId: "order_management"
    },
    {
      id: "warehouse-management",
      label: "Warehouse Management",
      icon: Warehouse,
      onClick: () => trackButtonClick("warehouse-management", () => setLocation("/admin/warehouse-management")),
      className: "border-indigo-300 text-indigo-600 hover:bg-indigo-50",
      moduleId: "warehouse_management"
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
      id: "wallet-management",
      label: "Wallet Management",
      icon: Wallet,
      onClick: () => trackButtonClick("wallet-management", () => setLocation("/admin/wallet-management")),
      className: "border-yellow-300 text-yellow-600 hover:bg-yellow-50",
      moduleId: "wallet_management"
    },
    {
      id: "payment-settings",
      label: "Payment Settings",
      icon: CreditCard,
      onClick: () => trackButtonClick("payment-settings", () => setLocation("/admin/payment-settings")),
      className: "border-red-300 text-red-600 hover:bg-red-50",
      moduleId: "payment_management"
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
      id: "inquiries",
      label: "Inquiries",
      icon: MessageSquare,
      onClick: () => trackButtonClick("inquiries", () => setLocation("/admin/inquiries")),
      className: "border-blue-300 text-blue-600 hover:bg-blue-50",
      moduleId: "inquiries"
    },
    {
      id: "email-settings",
      label: "Email Settings",
      icon: Mail,
      onClick: () => trackButtonClick("email-settings", () => setLocation("/admin/advanced-email-settings")),
      className: "border-cyan-300 text-cyan-600 hover:bg-cyan-50",
      moduleId: "email_settings"
    },
    {
      id: "content-management",
      label: "Content Management",
      icon: Edit3,
      onClick: () => trackButtonClick("content-management", () => setLocation("/content-management")),
      className: "border-lime-300 text-lime-600 hover:bg-lime-50",
      moduleId: "content_management"
    },
    {
      id: "seo",
      label: "SEO Management",
      icon: Globe,
      onClick: () => trackButtonClick("seo", () => setLocation("/seo-management")),
      className: "border-emerald-300 text-emerald-600 hover:bg-emerald-50",
      moduleId: "seo"
    },
    {
      id: "categories",
      label: "Categories",
      icon: Box,
      onClick: () => trackButtonClick("categories", () => setLocation("/category-management")),
      className: "border-violet-300 text-violet-600 hover:bg-violet-50",
      moduleId: "categories"
    },
    {
      id: "barcode",
      label: "Barcode",
      icon: QrCode,
      onClick: () => trackButtonClick("barcode", () => setLocation("/admin/barcode-inventory")),
      className: "border-rose-300 text-rose-600 hover:bg-rose-50",
      moduleId: "barcode"
    },
    {
      id: "database-backup",
      label: "Database Backup",
      icon: Database,
      onClick: () => trackButtonClick("database-backup", () => setLocation("/admin/database-management")),
      className: "border-stone-300 text-stone-600 hover:bg-stone-50",
      moduleId: "database_backup"
    },
    {
      id: "smtp-test",
      label: "SMTP Test",
      icon: TestTube,
      onClick: () => trackButtonClick("smtp-test", () => setLocation("/admin/smtp-test")),
      className: "border-amber-300 text-amber-600 hover:bg-amber-50",
      moduleId: "smtp_test"
    },
    {
      id: "ai-settings",
      label: "AI Settings",
      icon: Zap,
      onClick: () => trackButtonClick("ai-settings", () => setLocation("/admin/ai-settings")),
      className: "border-sky-300 text-sky-600 hover:bg-sky-50",
      moduleId: "ai_settings"
    },
    {
      id: "user-management",
      label: "User Management",
      icon: UserCog,
      onClick: () => trackButtonClick("user-management", () => setLocation("/admin/user-management")),
      className: "border-slate-300 text-slate-600 hover:bg-slate-50",
      moduleId: "user_management"
    },
    {
      id: "sms",
      label: "SMS Management",
      icon: Smartphone,
      onClick: () => trackButtonClick("sms", () => setLocation("/admin/sms-management")),
      className: "border-gray-300 text-gray-600 hover:bg-gray-50",
      moduleId: "sms"
    },
    {
      id: "factory",
      label: "Factory Management",
      icon: Factory,
      onClick: () => trackButtonClick("factory", () => setLocation("/admin/factory-management")),
      className: "border-neutral-300 text-neutral-600 hover:bg-neutral-50",
      moduleId: "factory"
    },
    {
      id: "procedures",
      label: "Procedures",
      icon: BookOpen,
      onClick: () => trackButtonClick("procedures", () => setLocation("/admin/procedures-management")),
      className: "border-zinc-300 text-zinc-600 hover:bg-zinc-50",
      moduleId: "procedures"
    },
    {
      id: "refresh-control",
      label: "Refresh Control",
      icon: RefreshCw,
      onClick: () => trackButtonClick("refresh-control", () => setLocation("/admin/global-refresh-settings")),
      className: "border-green-300 text-green-600 hover:bg-green-50",
      moduleId: "refresh_control"
    },
    {
      id: "logistics",
      label: "Logistics Management",
      icon: Truck,
      onClick: () => trackButtonClick("logistics", () => setLocation("/admin/logistics-management")),
      className: "border-orange-300 text-orange-600 hover:bg-orange-50",
      moduleId: "logistics_management"
    },
    {
      id: "ticketing",
      label: "Ticketing System",
      icon: Ticket,
      onClick: () => trackButtonClick("ticketing", () => setLocation("/admin/ticketing-system")),
      className: "border-rose-300 text-rose-600 hover:bg-rose-50",
      moduleId: "ticketing_system"
    },
    {
      id: "ai-seo-assistant",
      label: "AI SEO Assistant",
      icon: Brain,
      onClick: () => trackButtonClick("ai-seo-assistant", () => setLocation("/admin/ai-seo-assistant")),
      className: "border-purple-300 text-purple-600 hover:bg-purple-50",
      moduleId: "seo_management"
    }
  ];

  const getFilteredButtons = () => {
    if (isLoadingPermissions || !userPermissions?.success) return [];
    
    const allowedModules = userPermissions.permissions?.map((p: any) => p.moduleId) || [];
    const allButtons = getInitialButtons();
    
    console.log('🔍 [DEBUG] allowedModules:', allowedModules);
    console.log('🔍 [DEBUG] ticketing_system in allowedModules?', allowedModules.includes('ticketing_system'));
    
    const filtered = allButtons.filter(button => 
      !button.moduleId || allowedModules.includes(button.moduleId)
    );
    
    console.log('🔍 [DEBUG] ticketing button found in allButtons?', allButtons.find(b => b.moduleId === 'ticketing_system'));
    console.log('🔍 [DEBUG] ticketing button in filtered?', filtered.find(b => b.moduleId === 'ticketing_system'));
    
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