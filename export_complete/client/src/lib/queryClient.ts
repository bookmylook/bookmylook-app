import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, getFullUrl } from "./config";

console.log('[BOOKMYLOOK] API Base URL:', API_BASE_URL);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = res.statusText;
    
    try {
      if (contentType?.includes("application/json")) {
        const json = await res.json();
        errorMessage = json.message || json.error || errorMessage;
      } else {
        const text = await res.text();
        // Don't include HTML in error message - it's not useful to users
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          errorMessage = "Server error. Please try again.";
        } else {
          errorMessage = text || errorMessage;
        }
      }
    } catch (e) {
      // If parsing fails, use status text
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getFullUrl(url);
  
  console.log(`[BOOKMYLOOK] ${method} ${fullUrl}`);
  
  let res: Response;
  
  try {
    res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error: any) {
    console.error('[BOOKMYLOOK] Network error:', error);
    throw new Error("Connection error. Please try again.");
  }

  console.log(`[BOOKMYLOOK] Response: ${res.status} ${res.statusText}`);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = getFullUrl(url);
    const res = await fetch(fullUrl, {
      credentials: "include", // ALWAYS include credentials for session-based auth
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
