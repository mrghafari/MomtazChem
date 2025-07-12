import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Check if response is HTML instead of JSON
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
      console.error('Received HTML response instead of JSON for:', res.url);
      throw new Error(`${res.status}: API returned HTML instead of JSON`);
    }
    
    // Completely suppress 401 errors - they're expected for guest users
    if (res.status === 401) {
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

  await throwIfResNotOk(res);
  return res.json();
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

    await throwIfResNotOk(res);
    
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
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      onError: (error: any) => {
        // Suppress 401 auth errors globally - they're expected 
        if (!error.message?.includes('401:') && !error.message?.includes('احراز هویت نشده')) {
          console.error('Query error:', error);
        }
      },
    },
    mutations: {
      retry: false,
    },
  },
});
