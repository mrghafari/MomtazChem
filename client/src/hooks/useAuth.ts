import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false, // Don't retry to avoid interference with login flow
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes after successful login
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid interrupting user flow
    refetchOnMount: false, // Don't auto-refetch to avoid conflicts
    // Ensure credentials are included with requests
    queryFn: () => fetch("/api/admin/me", {
      credentials: 'include',
      cache: 'no-store',
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