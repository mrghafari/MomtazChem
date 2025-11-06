import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Package, RefreshCw, Database, CheckCircle } from "lucide-react";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Function to get the actual Site Management modules count
const getSiteManagementModulesCount = () => {
  const modules = [
    "syncing_shop", "shop_management", "product_management", "order_management", 
    "warehouse_management", "crm", "wallet_management", "finance", "payment_management",
    "geography_analytics", "inquiries", "email_settings", "content_management", 
    "seo", "categories", "barcode", "database_backup", "ai_settings", 
    "user_management", "sms", "whatsapp_crm", "factory", "procedures", "refresh_control", 
    "logistics_management", "ticketing_system", "remote_desktop", "server_config",
    "reports_analytics", "security_management", "notification_center", "system_monitoring", 
    "api_management", "integration_hub", "aws_s3_settings"
  ];
  return modules.length;
};

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  // Get the actual module count dynamically
  const moduleCount = getSiteManagementModulesCount();
  
  // Fetch admin dashboard content from Content Management
  const { data: adminContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content-management/items'],
    queryFn: () => fetch('/api/content-management/items?section=admin_dashboard')
      .then(res => res.json())
      .then(data => data.success ? data.data : []),
  });

  // Helper function to get content by key
  const getContent = (key: string, defaultValue: string) => {
    if (!adminContent) return defaultValue;
    const content = adminContent.find((item: any) => item.key === key && item.language === 'en');
    return content ? content.content : defaultValue;
  };

  return (
    <AuthGuard requireAuth={true} redirectTo="/admin/login">
      <AdminDashboardContent 
        user={user}
        logout={logout}
        setLocation={setLocation}
        moduleCount={moduleCount}
        getContent={getContent}
        contentLoading={contentLoading}
      />
    </AuthGuard>
  );
}

function AdminDashboardContent({ user, logout, setLocation, moduleCount, getContent, contentLoading }: any) {
  return (
    <div className="container mx-auto p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getPersonalizedWelcome(user?.username || "Admin")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {getDashboardMotivation()}
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Administrative Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">Centralized management and system controls</p>
                <Button 
                  onClick={() => setLocation("/admin/site-management")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Site Management
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.username}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                logout();
                setLocation("/admin/login");
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Comprehensive Site Management System</h2>
          <p className="text-gray-600 mb-4">
            Access the complete enterprise-grade administrative platform featuring {moduleCount} integrated modules for full business operations management. This centralized system provides comprehensive control over all aspects of your chemical solutions business - from production to customer delivery.
          </p>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete {moduleCount}-Module Administrative Suite:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm font-bold text-gray-700">
              <div>• <strong>Syncing Shop</strong> - Kardex/Shop synchronization</div>
              <div>• <strong>Inquiries</strong> - Customer inquiry & response management</div>
              <div>• <strong>Barcode</strong> - GS1-compliant EAN-13 generation</div>
              <div>• <strong>Email Settings</strong> - Multi-SMTP with 8 department routing</div>
              <div>• <strong>Database Backup</strong> - PostgreSQL maintenance & migration</div>
              <div>• <strong>CRM</strong> - Customer relationship & analytics</div>
              <div>• <strong>SEO</strong> - 4-language optimization & sitemaps</div>
              <div>• <strong>Categories</strong> - Hierarchical product classification</div>
              <div>• <strong>SMS</strong> - Multilingual customer notifications</div>
              <div>• <strong>WhatsApp CRM</strong> - Customer communication & bulk messaging</div>
              <div>• <strong>Factory</strong> - Production line management</div>
              <div>• <strong>User Management</strong> - Role-based access control</div>
              <div>• <strong>Shop</strong> - E-commerce & inventory administration</div>
              <div>• <strong>Procedures</strong> - Document & method management</div>
              <div>• <strong>Order Management</strong> - 3-department workflow system</div>
              <div>• <strong>Products</strong> - Showcase & shop catalog management</div>
              <div>• <strong>Payment Settings</strong> - Iraqi banking integration</div>
              <div>• <strong>Finance</strong> - Financial order management & approvals</div>
              <div>• <strong>Wallet Management</strong> - Digital wallet & recharge system</div>
              <div>• <strong>Geography Analytics</strong> - Regional performance & GPS tracking</div>
              <div>• <strong>AI Settings</strong> - Smart SKU generation & recommendations</div>
              <div>• <strong>Refresh Control</strong> - Centralized timing management</div>
              <div>• <strong>Content Management</strong> - 430+ multilingual content items</div>
              <div>• <strong>Warehouse Management</strong> - Unified inventory & goods tracking</div>
              <div>• <strong>Logistics Management</strong> - Delivery coordination & verification</div>
              <div>• <strong>Ticketing System</strong> - Support ticket management</div>
              <div>• <strong>Remote Desktop</strong> - RustDesk international support</div>
              <div>• <strong>Server Config</strong> - Production migration & hosting</div>
              <div>• <strong>AWS S3 Settings</strong> - Cloud storage configuration & management</div>
              <div>• <strong>Reports Analytics</strong> - Advanced business intelligence & KPIs</div>
              <div>• <strong>Security Management</strong> - Access control & audit trails</div>
              <div>• <strong>Notification Center</strong> - System alerts & communication hub</div>
              <div>• <strong>System Monitoring</strong> - Performance metrics & health checks</div>
              <div>• <strong>API Management</strong> - External integrations & endpoints</div>
              <div>• <strong>Integration Hub</strong> - Third-party service connections</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>🚀 Enterprise Features:</strong> Multi-language support (English, Arabic, Kurdish, Turkish), 
              AI-powered automation, comprehensive email routing, GPS delivery tracking, 
              and complete business workflow management - all unified in one powerful platform.
            </p>
          </div>
          


        </div>


      </div>
    </div>
  );
}

