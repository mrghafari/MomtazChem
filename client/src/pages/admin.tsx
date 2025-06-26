import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Package } from "lucide-react";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Administrative Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Centralized management and system controls</p>
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

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/site-management")}
            className="border-teal-300 text-teal-600 hover:bg-teal-50 h-20 flex flex-col items-center justify-center text-sm"
          >
            <Package className="w-6 h-6 mb-2" />
            Site Management
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Admin Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Access all administrative tools through the centralized Site Management interface 
            which includes comprehensive management for all system components.
          </p>
          <div className="text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">Site Management Features</h4>
            <ul className="space-y-1">
              <li>• 17 integrated administrative functions</li>
              <li>• Product catalog and inventory management</li>
              <li>• CRM and customer relationship management</li>
              <li>• Order workflow and logistics control</li>
              <li>• Email and SMS communication systems</li>
              <li>• User management and security settings</li>
              <li>• Database backup and system maintenance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}