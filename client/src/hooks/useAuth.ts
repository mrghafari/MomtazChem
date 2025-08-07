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
    queryKey: ["/api/admin/me"],
    retry: 1,
    staleTime: 5000, // Cache for 5 seconds to avoid excessive requests
    refetchOnWindowFocus: true,
    refetchInterval: getAuthRefreshInterval(), // Use global refresh settings for auth
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return { success: false, message: "Not authenticated" };
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Auth check result:", result);
        return result;
      } catch (error) {
        console.error("Auth check failed:", error);
        return { success: false, message: "Authentication check failed" };
      }
    },
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/admin/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      // Wait a bit and redirect to login page
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 200);
    },
  });

  const user = (data as any)?.success ? (data as any).user : null;
  const isAuthenticated = !!((data as any)?.success && (data as any)?.user);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}