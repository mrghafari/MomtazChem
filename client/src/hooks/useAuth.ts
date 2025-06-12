import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("/api/admin/logout", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      queryClient.clear();
    },
  });

  const user = data?.success ? data.user : null;
  const isAuthenticated = !!(data?.success && data?.user) && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}