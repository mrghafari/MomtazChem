import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, requestUrl?: string, method?: string) {
  if (!res.ok) {
    let text: string;
    try {
      text = await res.text();
    } catch (error) {
      text = res.statusText;
    }
    
    // Check if response is HTML instead of JSON
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
      console.error('Received HTML response instead of JSON for:', res.url);
      throw new Error(`${res.status}: API returned HTML instead of JSON`);
    }
    
    // Check for specific API endpoint error messages that indicate JSON response
    if (text.includes('API endpoint not found') && text.includes('success')) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `${res.status}: ${text}`);
      } catch (parseError) {
        throw new Error(`${res.status}: ${text}`);
      }
    }
    
    // Don't suppress 401 errors for DELETE operations - admin authentication is required
    if (res.status === 401) {
      if (requestUrl?.includes('/api/products/') && method === 'DELETE') {
        throw new Error("احراز هویت مورد نیاز است - لطفاً ابتدا وارد شوید");
      }
      return { success: false, message: 'Unauthorized' };
    }
    
    // Try to parse as JSON for structured error messages
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || `${res.status}: ${text}`);
    } catch (parseError) {
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  url: string,
  options: { method: string; body?: unknown } | undefined,
): Promise<any> {
  const method = options?.method || 'GET';
  const data = options?.body;
  

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Check if response is ok before parsing
  if (!res.ok) {
    await throwIfResNotOk(res, url, method);
  }
  
  // Parse JSON response safely
  try {
    return await res.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, queryKey[0] as string, 'GET');
    
    // Additional check for HTML response
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      console.error('Non-JSON content type received:', contentType);
      throw new Error('API returned non-JSON response');
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when window gains focus
      staleTime: () => {
        // Get stale time from global refresh settings
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          return settings.globalInterval * 1000; // Convert seconds to milliseconds
        }
        return 300000; // Default 5 minutes
      },
      gcTime: 0, // Don't cache queries at all
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
