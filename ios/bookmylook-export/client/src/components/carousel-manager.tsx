import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

        {/* Add Image Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Carousel Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Upload Method Toggle */}
              <div className="flex gap-2 border-b pb-3">
                <Button
                  type="button"
                  variant={uploadMethod === "file" ? "default" : "outline"}
                  onClick={() => setUploadMethod("file")}
                  size="sm"
                  className="flex-1"
                  data-testid="button-upload-file"
                >
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === "url" ? "default" : "outline"}
                  onClick={() => setUploadMethod("url")}
                  size="sm"
                  className="flex-1"
                  data-testid="button-upload-url"
                >
                  Image URL
                </Button>
              </div>

              {/* File Upload */}
              {uploadMethod === "file" && (
                <div>
                  <Label htmlFor="imageFile">Choose Image File</Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    data-testid="input-image-file"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload JPG, PNG, or GIF from your computer
                  </p>
                  {previewUrl && (
                    <div className="mt-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {uploadMethod === "url" && (
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    data-testid="input-image-url"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use Unsplash, Imgur, or any public image URL
                  </p>
                </div>
              )}

              {/* Location Filtering (Optional) */}
              <div className="border-t-2 border-blue-200 pt-4 mt-4 bg-blue-50/30 -mx-6 px-6 pb-4 rounded-b-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-900">Location Filter (Optional)</h4>
                </div>
                <p className="text-xs text-gray-600 mb-3 bg-blue-100 p-2 rounded border border-blue-200">
                  💡 Leave blank to show this image to <strong>all users</strong>. Select a location to target users in that specific area.
                </p>
                
                <div className="space-y-3">
                  {/* State Selection */}
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={selectedState || "all"} onValueChange={(value) => {
                      setSelectedState(value === "all" ? "" : value);
                      setSelectedDistrict("");
                      setSelectedTown("");
                    }}>
                      <SelectTrigger id="state" data-testid="select-state">
                        <SelectValue placeholder="Select state (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {states.map((state: any) => (
                          <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* District Selection */}
                  {selectedState && (
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Select value={selectedDistrict || "all"} onValueChange={(value) => {
                        setSelectedDistrict(value === "all" ? "" : value);
                        setSelectedTown("");
                      }}>
                        <SelectTrigger id="district" data-testid="select-district">
                          <SelectValue placeholder="Select district (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Districts</SelectItem>
                          {filteredDistricts.map((district: any) => (
                            <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Town Selection */}
                  {selectedDistrict && (
                    <div>
                      <Label htmlFor="town">Town / Area</Label>
                      <Select value={selectedTown || "all"} onValueChange={(value) => setSelectedTown(value === "all" ? "" : value)}>
                        <SelectTrigger id="town" data-testid="select-town">
                          <SelectValue placeholder="Select town (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Towns</SelectItem>
                          {filteredTowns.map((town: any) => (
                            <SelectItem key={town.id} value={town.id}>{town.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddImage}
                disabled={addImageMutation.isPending}
                data-testid="button-add-image"
              >
                {addImageMutation.isPending ? "Adding..." : "Add Image"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
