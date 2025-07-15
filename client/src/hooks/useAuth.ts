import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: 1,
    staleTime: 5000, // Cache for 5 seconds to avoid excessive requests
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds to maintain session
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      queryClient.clear();
      // Redirect to login page immediately after logout
      window.location.href = "/admin/login";
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