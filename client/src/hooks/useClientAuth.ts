import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getFullUrl } from "@/lib/config";

interface Client {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'client' | 'provider';
}

export function useClientAuth() {
  const queryClient = useQueryClient();
  
  const { data: client, isLoading } = useQuery({
    queryKey: ["/api/clients/current"],
    queryFn: async () => {
      // Try localStorage first for mobile apps
      const storedData = localStorage.getItem('clientData');
      if (storedData) {
        try {
          console.log('📱 Loading client from localStorage');
          return JSON.parse(storedData);
        } catch (e) {
          console.error('Failed to parse clientData:', e);
          localStorage.removeItem('clientData');
        }
      }
      
      // Fallback to server session
      const res = await fetch(getFullUrl("/api/clients/current"), {
        credentials: "include",
      });
      
      // If not authenticated on server, clear any stale localStorage
      if (res.status === 401) {
        localStorage.removeItem('clientData');
        localStorage.removeItem('userRole');
        return null;
      }
      
      // Throw for other errors  
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      const data = await res.json();
      
      // Store in localStorage as backup
      if (data && data.id) {
        localStorage.setItem('clientData', JSON.stringify(data));
      }
      
      return data;
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call logout API FIRST to destroy session
      try {
        await apiRequest("/api/auth/logout", "POST", {});
      } catch (error) {
        // Continue even if API call fails
        console.error("Logout API error:", error);
      }
      
      return true;
    },
    onSuccess: () => {
      // Clear query cache FIRST
      queryClient.clear();
      
      // Aggressively clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Use replace instead of href to prevent back button issues
      // Add timestamp to prevent any caching
      window.location.replace('/?t=' + Date.now());
    },
  });

  return {
    client: client as Client | undefined,
    isLoading,
    isAuthenticated: !!client,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}