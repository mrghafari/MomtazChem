import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCustomer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: false,
    staleTime: 1000, // 1 second - allow quick refresh after login
    refetchOnWindowFocus: true, // Enable refetch on focus for better UX
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/customers/logout", { method: "POST" }),
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