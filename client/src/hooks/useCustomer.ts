import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCustomer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get wallet information if customer is authenticated
  const { data: walletData } = useQuery({
    queryKey: ["/api/customer/wallet"],
    enabled: !!((data as any)?.success && (data as any)?.customer),
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/customers/logout", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/wallet"] });
      queryClient.clear();
    },
  });

  const customer = (data as any)?.success ? (data as any).customer : null;
  const isAuthenticated = !!((data as any)?.success && (data as any)?.customer) && !error;
  const walletBalance = (walletData as any)?.success ? (walletData as any).summary?.balance || 0 : 0;

  return {
    customer,
    isLoading,
    isAuthenticated,
    walletBalance,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}