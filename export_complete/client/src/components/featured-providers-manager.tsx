import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import ProviderCard from "@/components/provider-card";
import { Plus, Trash2, Edit, Save, X, Settings } from "lucide-react";
import type { Provider } from "@shared/schema";

interface FeaturedProvider {
  id: string;
  providerId: string;
  displayOrder: number;
  customTitle?: string;
  customDescription?: string;
  isActive: boolean;
}

export default function FeaturedProvidersManager() {
  const [isManaging, setIsManaging] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    providerId: "",
    customTitle: "",
    customDescription: "",
    displayOrder: 1
  });

  // Fetch all providers for selection
  const { data: allProviders = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"]
  });

  // Fetch featured providers (we'll need to create this API)
  const { data: featuredProviders = [], isLoading } = useQuery<(FeaturedProvider & { provider: Provider })[]>({
    queryKey: ["/api/featured-providers"]
  });

  const addFeaturedMutation = useMutation({
    mutationFn: async (data: Omit<FeaturedProvider, "id">) => {
      const response = await fetch("/api/featured-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to add featured provider");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-providers"] });
      toast({ title: "Provider added to featured list" });
      setNewProvider({ providerId: "", customTitle: "", customDescription: "", displayOrder: 1 });
    }
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeaturedProvider> }) => {
      const response = await fetch(`/api/featured-providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update featured provider");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-providers"] });
      toast({ title: "Featured provider updated" });
      setEditingProvider(null);
    }
  });

  const removeFeaturedMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/featured-providers/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to remove featured provider");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-providers"] });
      toast({ title: "Provider removed from featured list" });
    }
  });

  const activeFeaturedProviders = featuredProviders
    .filter(fp => fp.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

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
            Manage
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : activeFeaturedProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeFeaturedProviders.map((featured) => (
              <div key={featured.id} className="relative">
                <ProviderCard provider={featured.provider} />
                {featured.customTitle && (
                  <Badge className="absolute top-2 right-2 bg-purple-600">
                    Featured
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Manage Featured Providers</h2>
          <p className="text-gray-600">Add, remove, and customize your featured providers</p>
        </div>
        <Button 
          onClick={() => setIsManaging(false)}
          variant="outline"
          data-testid="exit-management-mode"
        >
          <X className="w-4 h-4 mr-2" />
          Done
        </Button>
      </div>

      {/* Add New Featured Provider */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Featured Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="provider-select">Select Provider</Label>
              <select
                id="provider-select"
                value={newProvider.providerId}
                onChange={(e) => setNewProvider({ ...newProvider, providerId: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="select-provider"
              >
                <option value="">Choose a provider...</option>
                {allProviders
                  .filter(p => !featuredProviders.some(fp => fp.providerId === p.id))
                  .map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.businessName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                value={newProvider.displayOrder}
                onChange={(e) => setNewProvider({ ...newProvider, displayOrder: parseInt(e.target.value) || 1 })}
                min="1"
                data-testid="input-display-order"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="custom-title">Custom Title (Optional)</Label>
              <Input
                id="custom-title"
                value={newProvider.customTitle}
                onChange={(e) => setNewProvider({ ...newProvider, customTitle: e.target.value })}
                placeholder="e.g., 'Top Rated Stylist'"
                data-testid="input-custom-title"
              />
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="custom-description">Custom Description (Optional)</Label>
            <Textarea
              id="custom-description"
              value={newProvider.customDescription}
              onChange={(e) => setNewProvider({ ...newProvider, customDescription: e.target.value })}
              placeholder="Custom description for this featured provider"
              data-testid="textarea-custom-description"
            />
          </div>
          <Button 
            onClick={() => addFeaturedMutation.mutate({
              providerId: newProvider.providerId,
              customTitle: newProvider.customTitle || undefined,
              customDescription: newProvider.customDescription || undefined,
              displayOrder: newProvider.displayOrder,
              isActive: true
            })}
            disabled={!newProvider.providerId || addFeaturedMutation.isPending}
            data-testid="add-featured-provider"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Featured Provider
          </Button>
        </CardContent>
      </Card>

      {/* Current Featured Providers */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Current Featured Providers</h3>
        {featuredProviders.length === 0 ? (
          <p className="text-gray-500">No featured providers yet. Add some above!</p>
        ) : (
          featuredProviders
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((featured) => (
              <Card key={featured.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg">
                          {featured.provider.businessName}
                        </h4>
                        <Badge variant={featured.isActive ? "default" : "secondary"}>
                          {featured.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Order: {featured.displayOrder}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {featured.provider.contactPhone}
                      </p>
                      {featured.customTitle && (
                        <p className="text-sm font-medium text-purple-700">
                          Custom Title: {featured.customTitle}
                        </p>
                      )}
                      {featured.customDescription && (
                        <p className="text-sm text-gray-600 mt-1">
                          {featured.customDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProvider(
                          editingProvider === featured.id ? null : featured.id
                        )}
                        data-testid={`edit-provider-${featured.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateFeaturedMutation.mutate({
                          id: featured.id,
                          data: { isActive: !featured.isActive }
                        })}
                        data-testid={`toggle-provider-${featured.id}`}
                      >
                        {featured.isActive ? "Hide" : "Show"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFeaturedMutation.mutate(featured.id)}
                        data-testid={`remove-provider-${featured.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {editingProvider === featured.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Custom Title</Label>
                          <Input
                            defaultValue={featured.customTitle || ""}
                            placeholder="e.g., 'Top Rated Stylist'"
                            data-testid={`edit-title-${featured.id}`}
                          />
                        </div>
                        <div>
                          <Label>Display Order</Label>
                          <Input
                            type="number"
                            defaultValue={featured.displayOrder}
                            min="1"
                            data-testid={`edit-order-${featured.id}`}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Custom Description</Label>
                        <Textarea
                          defaultValue={featured.customDescription || ""}
                          placeholder="Custom description for this featured provider"
                          data-testid={`edit-description-${featured.id}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const titleInput = document.querySelector(`[data-testid="edit-title-${featured.id}"]`) as HTMLInputElement;
                            const orderInput = document.querySelector(`[data-testid="edit-order-${featured.id}"]`) as HTMLInputElement;
                            const descInput = document.querySelector(`[data-testid="edit-description-${featured.id}"]`) as HTMLTextAreaElement;
                            
                            updateFeaturedMutation.mutate({
                              id: featured.id,
                              data: {
                                customTitle: titleInput?.value || undefined,
                                displayOrder: parseInt(orderInput?.value) || featured.displayOrder,
                                customDescription: descInput?.value || undefined,
                              }
                            });
                          }}
                          data-testid={`save-provider-${featured.id}`}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProvider(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}