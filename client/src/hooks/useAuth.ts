import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
    staleTime: 0, // Always fetch fresh data to avoid authentication issues
    refetchOnWindowFocus: false,
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/admin/logout", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      queryClient.clear();
    },
  });

  const user = (data as any)?.success ? (data as any).user : null;
  const isAuthenticated = !!((data as any)?.success && (data as any)?.user) && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}