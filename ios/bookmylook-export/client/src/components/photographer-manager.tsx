import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Trash2, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PhotographerManagerProps {
  adminToken: string;
}

export default function PhotographerManager({ adminToken }: PhotographerManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTown, setSelectedTown] = useState("");

  // Fetch data
  const { data: states = [] } = useQuery({ 
    queryKey: ["/api/admin/states"],
    queryFn: async () => {
      const response = await fetch("/api/admin/states", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch states");
      return response.json();
    }
  });
  const { data: districts = [] } = useQuery({ 
    queryKey: ["/api/admin/districts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/districts", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch districts");
      return response.json();
    }
  });
  const { data: towns = [] } = useQuery({ 
    queryKey: ["/api/admin/towns"],
    queryFn: async () => {
      const response = await fetch("/api/admin/towns", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch towns");
      return response.json();
    }
  });
  const { data: photographers = [] } = useQuery({ 
    queryKey: ["/api/admin/photographers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/photographers", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch photographers");
      return response.json();
    }
  });

  // Filter districts and towns based on selection
  const filteredDistricts = selectedState
    ? districts.filter((d: any) => d.stateId === selectedState)
    : [];
  
  const filteredTowns = selectedDistrict
    ? towns.filter((t: any) => t.districtId === selectedDistrict)
    : [];

  // Add photographer mutation
  const addPhotographerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/photographers", "POST", {
        name,
        phone,
        email,
        description,
        stateId: selectedState || null,
        districtId: selectedDistrict || null,
        townId: selectedTown || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/photographers"] });
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setDescription("");
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedTown("");
      toast({ title: "Photographer added successfully" });
    },
  });

  // Delete photographer mutation
  const deletePhotographerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/photographers/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/photographers"] });
      toast({ title: "Photographer deleted" });
    },
  });

  const getLocationDisplay = (photographer: any) => {
    const state = states.find((s: any) => s.id === photographer.stateId);
    const district = districts.find((d: any) => d.id === photographer.districtId);
    const town = towns.find((t: any) => t.id === photographer.townId);
    
    const parts = [];
    if (town) parts.push(town.name);
    if (district) parts.push(district.name);
    if (state) parts.push(state.name);
    
    return parts.length > 0 ? parts.join(", ") : "All India";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Add New Photographer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-photographer-name"
            />
            <Input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-photographer-phone"
            />
            <Input
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-photographer-email"
            />
            <Select value={selectedState || "all"} onValueChange={(val) => {
              setSelectedState(val === "all" ? "" : val);
              setSelectedDistrict("");
              setSelectedTown("");
            }}>
              <SelectTrigger data-testid="select-photographer-state">
                <SelectValue placeholder="Select State (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All India</SelectItem>
                {states.map((state: any) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDistrict || "all"} onValueChange={(val) => {
              setSelectedDistrict(val === "all" ? "" : val);
              setSelectedTown("");
            }} disabled={!selectedState}>
              <SelectTrigger data-testid="select-photographer-district">
                <SelectValue placeholder="Select District (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {filteredDistricts.map((district: any) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTown || "all"} onValueChange={(val) => setSelectedTown(val === "all" ? "" : val)} disabled={!selectedDistrict}>
              <SelectTrigger data-testid="select-photographer-town">
                <SelectValue placeholder="Select Town (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Towns</SelectItem>
                {filteredTowns.map((town: any) => (
                  <SelectItem key={town.id} value={town.id}>
                    {town.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:col-span-2">
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-testid="textarea-photographer-description"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => addPhotographerMutation.mutate()}
                disabled={!name || !phone || addPhotographerMutation.isPending}
                className="w-full"
                data-testid="button-add-photographer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Photographer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photographers List ({photographers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {photographers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No photographers added yet</p>
            ) : (
              photographers.map((photographer: any) => (
                <div key={photographer.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold">{photographer.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{photographer.phone}</p>
                    {photographer.email && (
                      <p className="text-sm text-gray-600">{photographer.email}</p>
                    )}
                    {photographer.description && (
                      <p className="text-sm text-gray-700 mt-2">{photographer.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        📍 {getLocationDisplay(photographer)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePhotographerMutation.mutate(photographer.id)}
                    data-testid={`button-delete-photographer-${photographer.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
