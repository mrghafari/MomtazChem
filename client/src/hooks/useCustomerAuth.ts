import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useCustomerAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: 1,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    queryFn: async () => {
      try {
        const response = await fetch("/api/customers/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return { success: false, message: "Not authenticated" };
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Customer auth check result:", result);
        return result;
      } catch (error) {
        console.error("Customer auth check failed:", error);
        return { success: false, message: "Authentication check failed" };
      }
    },
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/customers/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/wallet"] });
      queryClient.clear();
    },
  });

  const user = (data as any)?.success ? (data as any).customer : null;
  const isAuthenticated = !!((data as any)?.success && (data as any)?.customer);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}