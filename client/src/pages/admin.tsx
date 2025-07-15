import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Package } from "lucide-react";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  
  // Fetch admin dashboard content from Content Management
  const { data: adminContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content-management/items'],
    queryFn: () => fetch('/api/content-management/items?section=admin_dashboard')
      .then(res => res.json())
      .then(data => data.success ? data.data : []),
    enabled: isAuthenticated
  });

  // Helper function to get content by key
  const getContent = (key: string, defaultValue: string) => {
    if (!adminContent) return defaultValue;
    const content = adminContent.find((item: any) => item.key === key && item.language === 'en');
    return content ? content.content : defaultValue;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

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
                  onClick={() => setLocation("/site-management")}
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Access all administrative tools through the centralized Site Management interface which includes comprehensive management for all system components.
          </p>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">All 24 Site Management Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 text-xs text-gray-600">
              <div>• Syncing Shop - Product synchronization</div>
              <div>• Inquiries - Customer inquiry management</div>
              <div>• Barcode - EAN-13 barcode generation</div>
              <div>• Email Settings - Multi-SMTP configuration</div>
              <div>• Database Backup - System backup tools</div>
              <div>• CRM - Customer relationship management</div>
              <div>• SEO - Multilingual SEO optimization</div>
              <div>• Categories - Product categorization</div>
              <div>• SMS - Customer notification system</div>
              <div>• Factory - Production management</div>
              <div>• User Management - Admin user control</div>
              <div>• Shop - E-commerce administration</div>
              <div>• Procedures - Document management</div>
              <div>• SMTP Test - Email connectivity testing</div>
              <div>• Order Management - Order tracking system</div>
              <div>• Products - Catalog management</div>
              <div>• Payment Settings - Banking integration</div>
              <div>• Wallet Management - Digital wallet system</div>
              <div>• Geography Analytics - Regional analysis</div>
              <div>• AI Settings - Smart automation tools</div>
              <div>• Refresh Control - System timing settings</div>
              <div>• Department Users - Role-based access</div>
              <div>• Inventory Management - Stock control</div>
              <div>• Content Management - Dynamic content</div>
              <div>• Warehouse Management - Order workflow</div>
              <div>• Logistics Management - Delivery coordination</div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}