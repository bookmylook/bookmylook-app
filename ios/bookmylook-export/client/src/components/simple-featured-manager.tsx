import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Settings, X, AlertTriangle, Shield } from "lucide-react";
import type { Provider } from "@shared/schema";
import CarouselManager from "./carousel-manager";

interface SimpleFeaturedManagerProps {
  initialAdminMode?: boolean;
  initialAdminToken?: string;
}

export default function SimpleFeaturedManager({ 
  initialAdminMode = false,
  initialAdminToken = ""
}: SimpleFeaturedManagerProps = {}) {
  const [isManaging, setIsManaging] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(initialAdminMode);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState(initialAdminToken);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Check for existing admin token on component mount or use initial props
  useEffect(() => {
    if (initialAdminToken) {
      setAdminToken(initialAdminToken);
      setIsAdminMode(true);
    } else {
      const savedToken = localStorage.getItem('adminToken');
      if (savedToken) {
        setAdminToken(savedToken);
        setIsAdminMode(true);
      }
    }
  }, [initialAdminToken]);
  
  // Update when props change
  useEffect(() => {
    if (initialAdminMode) {
      setIsAdminMode(true);
    }
    if (initialAdminToken) {
      setAdminToken(initialAdminToken);
    }
  }, [initialAdminMode, initialAdminToken]);

  // Get all providers
  const { data: allProviders = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"]
  });

  // Get featured providers from database
  const { data: featuredProviders = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers/featured"]
  });

  // Mutation to set provider as featured
  const setFeaturedMutation = useMutation({
    mutationFn: async ({ providerId, isFeatured, order }: { providerId: string; isFeatured: boolean; order?: number }) => {
      const response = await fetch(`/api/admin/providers/${providerId}/featured`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isFeatured, featuredOrder: order })
      });
      if (!response.ok) throw new Error("Failed to update featured status");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({ 
        title: variables.isFeatured ? "Provider featured" : "Provider unfeatured",
        description: data.message
      });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Unable to update featured status", variant: "destructive" });
    }
  });

  const addProvider = (providerId: string) => {
    const nextOrder = featuredProviders.length + 1;
    setFeaturedMutation.mutate({ providerId, isFeatured: true, order: nextOrder });
  };

  const removeProvider = (providerId: string) => {
    setFeaturedMutation.mutate({ providerId, isFeatured: false });
  };

  const adminAuthentication = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "play_console_manager" })
      });
      if (!response.ok) throw new Error("Authentication failed");
      return response.json();
    },
    onSuccess: (data) => {
      setIsAdminMode(true);
      setAdminPassword("");
      setAdminToken(data.token);
      localStorage.setItem('adminToken', data.token);
      toast({ title: "Admin access granted", description: "You can now remove providers permanently" });
    },
    onError: () => {
      toast({ title: "Authentication failed", description: "Invalid Google Play Console manager credentials", variant: "destructive" });
    }
  });
  
  const handleLogout = () => {
    setIsAdminMode(false);
    setAdminToken("");
    localStorage.removeItem('adminToken');
    toast({ title: "Logged out", description: "Admin session ended" });
  };

  const permanentDeleteMutation = useMutation({
    mutationFn: async (providerId: string) => {
      console.log('🗑️ Attempting to delete provider:', providerId);
      console.log('🔑 Admin token exists:', !!adminToken);
      
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        }
      });
      
      console.log('📡 Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Delete failed:', errorData);
        throw new Error(errorData.error || "Failed to delete provider");
      }
      
      const result = await response.json();
      console.log('✅ Delete successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/featured"] });
      setShowDeleteDialog(false);
      setProviderToDelete(null);
      toast({ title: "Provider permanently removed", description: "Provider has been completely deleted from the platform" });
    },
    onError: (error: any) => {
      console.error('❌ Delete mutation error:', error);
      toast({ 
        title: "Deletion failed", 
        description: error.message || "Unable to remove provider from platform", 
        variant: "destructive" 
      });
    }
  });

  const handleAdminLogin = () => {
    if (!adminPassword.trim()) {
      toast({ title: "Password required", description: "Enter Google Play Console manager password", variant: "destructive" });
      return;
    }
    adminAuthentication.mutate(adminPassword);
  };

  const handlePermanentDelete = (provider: Provider) => {
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  if (!isManaging) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Featured Providers</h2>
            <p className="text-gray-600">Showcasing our top beauty professionals</p>
          </div>
          <Button 
            onClick={() => setIsManaging(true)}
            variant="outline"
            className="ml-4"
            data-testid="manage-featured-providers"
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>
        
        {featuredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-purple-600">Featured</Badge>
                  <h3 className="text-xl font-bold mb-2">{provider.businessName}</h3>
                  <p className="text-gray-600 mb-2">{provider.description || "Beauty professional"}</p>
                  <p className="text-sm text-gray-500 flex items-center">
                    📍 {provider.location}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 mb-4">No featured providers configured</p>
            <Button onClick={() => setIsManaging(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Featured Providers
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Customize Featured Providers</h2>
          <p className="text-gray-600">Select which providers to showcase on the homepage</p>
        </div>
        <div className="flex gap-3">
          {!isAdminMode ? (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Play Console Manager Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-64"
                data-testid="admin-password"
              />
              <Button
                onClick={handleAdminLogin}
                disabled={adminAuthentication.isPending}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                data-testid="admin-login"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Access
              </Button>
            </div>
          ) : isAdminMode ? (
            <div className="flex gap-2">
              <Badge className="bg-red-600 text-white px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Admin Mode Active
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
                data-testid="admin-logout"
              >
                Logout
              </Button>
            </div>
          ) : null}
          <Button 
            onClick={() => {
              setIsManaging(false);
              toast({ title: "Done customizing featured providers" });
            }}
            className="bg-green-600 hover:bg-green-700"
            data-testid="save-changes"
          >
            Done
          </Button>
        </div>
      </div>

      {/* Carousel Manager Section - Only show when admin authenticated */}
      {isAdminMode && adminToken && (
        <div className="mb-8" data-testid="carousel-manager-section">
          <CarouselManager adminToken={adminToken} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProviders.map((provider) => {
          const isSelected = featuredProviders.some(fp => fp.id === provider.id);
          return (
            <Card 
              key={provider.id} 
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-lg'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{provider.businessName}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {provider.description || "Beauty professional"}
                    </p>
                    <p className="text-xs text-gray-500">📍 {provider.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSelected ? "destructive" : "default"}
                      onClick={() => {
                        if (isSelected) {
                          removeProvider(provider.id);
                        } else {
                          addProvider(provider.id);
                        }
                      }}
                      data-testid={`toggle-provider-${provider.id}`}
                    >
                      {isSelected ? (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                    {isAdminMode && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-700 hover:bg-red-800 border-2 border-red-600"
                        onClick={() => handlePermanentDelete(provider)}
                        data-testid={`delete-provider-${provider.id}`}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-purple-600 text-white">
                    ✨ Featured
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {featuredProviders.length > 0 && (
        <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Featured Providers ({featuredProviders.length})
          </h3>
          <p className="text-green-700 text-sm">
            These providers are showcased in the featured section on your homepage.
          </p>
        </div>
      )}

      {/* Admin Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Permanently Delete Provider
            </DialogTitle>
            <DialogDescription>
              This action will completely remove the provider from the BookMyLook platform and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {providerToDelete && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-bold text-red-800">{providerToDelete.businessName}</h4>
              <p className="text-red-700 text-sm">📍 {providerToDelete.location}</p>
              <p className="text-red-600 text-xs mt-2">
                This will delete all associated bookings, reviews, services, and data permanently.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setProviderToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-700 hover:bg-red-800"
              onClick={() => providerToDelete && permanentDeleteMutation.mutate(providerToDelete.id)}
              disabled={permanentDeleteMutation.isPending}
              data-testid="confirm-delete"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {permanentDeleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}