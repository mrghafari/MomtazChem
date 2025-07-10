import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCustomer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      // Suppress 401 errors as they're expected when not authenticated
      if (!error.message?.includes('401:')) {
        console.error('Customer auth error:', error);
      }
    },
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