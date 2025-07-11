import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCustomer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: false,
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true, // Refresh when window gains focus
    refetchInterval: 30000, // Check every 30 seconds
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/customers/logout", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      queryClient.clear();
    },
  });

  const customer = (data as any)?.success ? (data as any).customer : null;
  const isAuthenticated = !!(customer && !error);

  return {
    customer,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}