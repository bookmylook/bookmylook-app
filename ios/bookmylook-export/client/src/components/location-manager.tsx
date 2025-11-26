import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LocationManagerProps {
  adminToken: string;
}

export default function LocationManager({ adminToken }: LocationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newStateName, setNewStateName] = useState("");
  const [newStateCode, setNewStateCode] = useState("");
  const [newDistrictName, setNewDistrictName] = useState("");
  const [selectedStateForDistrict, setSelectedStateForDistrict] = useState("");
  const [newTownName, setNewTownName] = useState("");
  const [selectedDistrictForTown, setSelectedDistrictForTown] = useState("");

  // Fetch states
  const { data: states = [] } = useQuery({
    queryKey: ["/api/admin/states"],
  });

  // Fetch districts
  const { data: districts = [] } = useQuery({
    queryKey: ["/api/admin/districts"],
  });

  // Fetch towns
  const { data: towns = [] } = useQuery({
    queryKey: ["/api/admin/towns"],
  });

  // Add state mutation
  const addStateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/states", "POST", {
        name: newStateName,
        code: newStateCode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/states"] });
      setNewStateName("");
      setNewStateCode("");
      toast({ title: "State added successfully" });
    },
  });

  // Add district mutation
  const addDistrictMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/districts", "POST", {
        name: newDistrictName,
        stateId: selectedStateForDistrict,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/districts"] });
      setNewDistrictName("");
      toast({ title: "District added successfully" });
    },
  });

  // Add town mutation
  const addTownMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/towns", "POST", {
        name: newTownName,
        districtId: selectedDistrictForTown,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/towns"] });
      setNewTownName("");
      toast({ title: "Town added successfully" });
    },
  });

  // Delete mutations
  const deleteStateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/states/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/states"] });
      toast({ title: "State deleted" });
    },
  });

  const deleteDistrictMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/districts/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/districts"] });
      toast({ title: "District deleted" });
    },
  });

  const deleteTownMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/towns/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/towns"] });
      toast({ title: "Town deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* States Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Indian States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="State Name (e.g., Jammu & Kashmir)"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  data-testid="input-state-name"
                />
                <Input
                  placeholder="State Code (e.g., JK)"
                  value={newStateCode}
                  onChange={(e) => setNewStateCode(e.target.value.toUpperCase())}
                  maxLength={3}
                  data-testid="input-state-code"
                />
                <Button
                  onClick={() => addStateMutation.mutate()}
                  disabled={!newStateName || !newStateCode || addStateMutation.isPending}
                  className="w-full"
                  data-testid="button-add-state"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add State
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {states.map((state: any) => (
                  <div key={state.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {state.name} ({state.code})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteStateMutation.mutate(state.id)}
                      data-testid={`button-delete-state-${state.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Districts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Districts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Select value={selectedStateForDistrict} onValueChange={setSelectedStateForDistrict}>
                  <SelectTrigger data-testid="select-state-for-district">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state: any) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="District Name (e.g., Srinagar)"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  data-testid="input-district-name"
                />
                <Button
                  onClick={() => addDistrictMutation.mutate()}
                  disabled={!newDistrictName || !selectedStateForDistrict || addDistrictMutation.isPending}
                  className="w-full"
                  data-testid="button-add-district"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add District
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {districts.map((district: any) => (
                  <div key={district.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{district.name}</div>
                      <div className="text-xs text-gray-500">
                        {states.find((s: any) => s.id === district.stateId)?.name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDistrictMutation.mutate(district.id)}
                      data-testid={`button-delete-district-${district.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Towns Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Towns / Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Select value={selectedDistrictForTown} onValueChange={setSelectedDistrictForTown}>
                  <SelectTrigger data-testid="select-district-for-town">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district: any) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name} ({states.find((s: any) => s.id === district.stateId)?.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Town Name (e.g., Lal Chowk)"
                  value={newTownName}
                  onChange={(e) => setNewTownName(e.target.value)}
                  data-testid="input-town-name"
                />
                <Button
                  onClick={() => addTownMutation.mutate()}
                  disabled={!newTownName || !selectedDistrictForTown || addTownMutation.isPending}
                  className="w-full"
                  data-testid="button-add-town"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Town
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {towns.map((town: any) => (
                  <div key={town.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{town.name}</div>
                      <div className="text-xs text-gray-500">
                        {districts.find((d: any) => d.id === town.districtId)?.name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTownMutation.mutate(town.id)}
                      data-testid={`button-delete-town-${town.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
