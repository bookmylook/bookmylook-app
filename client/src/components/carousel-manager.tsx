import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Image as ImageIcon, MapPin } from "lucide-react";
import type { CarouselImage } from "@shared/schema";

interface CarouselManagerProps {
  adminToken: string;
}

export default function CarouselManager({ adminToken }: CarouselManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTown, setSelectedTown] = useState("");

  // Get all carousel images
  const { data: images = [] } = useQuery<CarouselImage[]>({
    queryKey: ["/api/carousel-images"]
  });

  // Fetch locations
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

  // Filter districts and towns based on selection
  const filteredDistricts = selectedState
    ? districts.filter((d: any) => d.stateId === selectedState)
    : [];
  
  const filteredTowns = selectedDistrict
    ? towns.filter((t: any) => t.districtId === selectedDistrict)
    : [];

  // Add carousel image mutation
  const addImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch("/api/admin/carousel-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          imageUrl,
          displayOrder: images.length + 1,
          isActive: true,
          stateId: selectedState || null,
          districtId: selectedDistrict || null,
          townId: selectedTown || null,
        })
      });
      if (!response.ok) throw new Error("Failed to add image");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
      setShowAddDialog(false);
      setNewImageUrl("");
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedTown("");
      toast({ title: "Success", description: "Carousel image added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add image", variant: "destructive" });
    }
  });

  // Delete carousel image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/admin/carousel-images/${imageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to delete image");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
      toast({ title: "Success", description: "Carousel image removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImage = async () => {
    if (uploadMethod === "url") {
      if (!newImageUrl.trim()) {
        toast({ title: "Error", description: "Please enter an image URL", variant: "destructive" });
        return;
      }
      addImageMutation.mutate(newImageUrl);
    } else {
      if (!selectedFile) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('displayOrder', String(images.length + 1));
      formData.append('isActive', 'true');
      if (selectedState) formData.append('stateId', selectedState);
      if (selectedDistrict) formData.append('districtId', selectedDistrict);
      if (selectedTown) formData.append('townId', selectedTown);

      try {
        const response = await fetch("/api/admin/carousel-images/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${adminToken}`
          },
          body: formData
        });

        if (!response.ok) throw new Error("Failed to upload image");
        
        queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
        setShowAddDialog(false);
        setSelectedFile(null);
        setPreviewUrl("");
        setSelectedState("");
        setSelectedDistrict("");
        setSelectedTown("");
        toast({ title: "Success", description: "Image uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Homepage Carousel
          </CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.imageUrl}
                alt="Carousel"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteImageMutation.mutate(image.id)}
                  disabled={deleteImageMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-1 text-xs text-gray-500">Order: {image.displayOrder}</div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No carousel images yet. Add one to get started!
          </div>
        )}

        {/* Add Image Dialog - Ultra Compact */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[320px] p-3">
            <div className="space-y-2">
              {/* File Input Only */}
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer h-8"
                data-testid="input-image-file"
              />

              {/* Location Dropdowns */}
              <select
                value={selectedState || ""}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                  setSelectedTown("");
                }}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
                data-testid="select-state"
              >
                <option value="">All States (Global)</option>
                {states.map((state: any) => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))}
              </select>

              {selectedState && (
                <select
                  value={selectedDistrict || ""}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedTown("");
                  }}
                  className="w-full px-2 py-1.5 text-sm border rounded bg-background"
                  data-testid="select-district"
                >
                  <option value="">All Districts</option>
                  {filteredDistricts.map((district: any) => (
                    <option key={district.id} value={district.id}>{district.name}</option>
                  ))}
                </select>
              )}

              {selectedDistrict && (
                <select
                  value={selectedTown || ""}
                  onChange={(e) => setSelectedTown(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded bg-background"
                  data-testid="select-town"
                >
                  <option value="">All Towns</option>
                  {filteredTowns.map((town: any) => (
                    <option key={town.id} value={town.id}>{town.name}</option>
                  ))}
                </select>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddImage}
                  disabled={addImageMutation.isPending}
                  data-testid="button-add-image"
                >
                  {addImageMutation.isPending ? "..." : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
