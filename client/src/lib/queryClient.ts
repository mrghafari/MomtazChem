import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
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
    // Add cache-busting for inventory-related endpoints
    const isInventoryEndpoint = (queryKey[0] as string).includes('/api/shop/');
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...(isInventoryEndpoint && {
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      })
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: (query) => {
        // Disable caching for inventory-related endpoints
        const queryKey = query.queryKey[0] as string;
        return queryKey.includes('/api/shop/') ? 0 : 5 * 60 * 1000;
      },
      gcTime: (query) => {
        // Don't cache inventory data at all
        const queryKey = query.queryKey[0] as string;
        return queryKey.includes('/api/shop/') ? 0 : 5 * 60 * 1000;
      },
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
