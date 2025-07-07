import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
    staleTime: 0, // Always fetch fresh data to avoid authentication issues
    refetchOnWindowFocus: false,
    // Ensure credentials are included with requests
    queryFn: () => fetch("/api/admin/me", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Authentication failed');
      }
      return res.json();
    }),
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

  console.log('useAuth state:', {
    data,
    isLoading,
    error,
    user,
    isAuthenticated
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}