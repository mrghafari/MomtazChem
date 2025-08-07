import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  // Get auth refresh interval from global settings
  const getAuthRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const securitySettings = settings.departments.security;
      
      if (securitySettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : securitySettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 30000; // Default 30 seconds if no settings found
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/check"],
    retry: 1,
    staleTime: 5000, // Cache for 5 seconds to avoid excessive requests
    refetchOnWindowFocus: true,
    refetchInterval: getAuthRefreshInterval(), // Use global refresh settings for auth
    queryFn: async () => {
      try {
        // First try admin authentication
        const adminResponse = await fetch("/api/admin/me", {
          credentials: "include",
        });
        
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          if (adminResult.success) {
            return { ...adminResult, userType: 'admin' };
          }
        }
        
        // If admin fails, try customer authentication
        const customerResponse = await fetch("/api/customers/me", {
          credentials: "include",
        });
        
        if (customerResponse.ok) {
          const customerResult = await customerResponse.json();
          if (customerResult.success) {
            return { 
              success: true, 
              user: customerResult.customer, 
              userType: 'customer' 
            };
          }
        }
        
        // Neither authentication worked
        return { success: false, message: "Not authenticated" };
      } catch (error) {
        console.error("Auth check failed:", error);
        return { success: false, message: "Authentication check failed" };
      }
    },
  });

  const logout = useMutation({
    mutationFn: () => {
      const userType = (data as any)?.userType || 'admin';
      const logoutEndpoint = userType === 'customer' ? "/api/customers/logout" : "/api/admin/logout";
      return apiRequest(logoutEndpoint, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.clear();
      const userType = (data as any)?.userType || 'admin';
      const loginPath = userType === 'customer' ? "/customer/login" : "/admin/login";
      // Wait a bit and redirect to appropriate login page
      setTimeout(() => {
        window.location.href = loginPath;
      }, 200);
    },
  });

  const user = (data as any)?.success ? (data as any).user : null;
  const isAuthenticated = !!((data as any)?.success && (data as any)?.user);
  const userType = (data as any)?.userType || null;

  return {
    user,
    isLoading,
    isAuthenticated,
    userType,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}