import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Plus, Image, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface ProductUploadProps {
  providerId: string;
  onSuccess?: () => void;
}

const productCategories = [
  { value: "cosmetics", label: "Cosmetics & Beauty Products" },
  { value: "tools", label: "Professional Tools & Equipment" },
  { value: "accessories", label: "Beauty Accessories" },
  { value: "skincare", label: "Skincare Products" },
  { value: "haircare", label: "Hair Care Products" },
  { value: "nailcare", label: "Nail Care Products" },
];

export default function ProductUpload({ providerId, onSuccess }: ProductUploadProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    originalPrice: "",
    brand: "",
    stockQuantity: "",
    isInStock: true,
    isDigital: false,
    downloadUrl: "",
    isActive: true,
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState("");
  const [currentTag, setCurrentTag] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/products", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onSuccess?.();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload product",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      originalPrice: "",
      brand: "",
      stockQuantity: "",
      isInStock: true,
      isDigital: false,
      downloadUrl: "",
      isActive: true,
    });
    setFeatures([]);
    setTags([]);
    setCurrentFeature("");
    setCurrentTag("");
    setImageUrls([]);
    setVideoUrls([]);
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL as string;
      setImageUrls(prev => [...prev, uploadURL]);
    }
  };

  const handleVideoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL as string;
      setVideoUrls(prev => [...prev, uploadURL]);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (currentFeature.trim() && !features.includes(currentFeature.trim())) {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter(feature => feature !== featureToRemove));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price || imageUrls.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and upload at least one image",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      providerId,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: formData.price,
      originalPrice: formData.originalPrice || undefined,
      brand: formData.brand || undefined,
      stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
      isInStock: formData.isInStock,
      isDigital: formData.isDigital,
      downloadUrl: formData.downloadUrl || undefined,
      imageUrls,
      videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
      features,
      tags,
      isActive: formData.isActive,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Product to BookMyLook Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Professional Hair Dryer"
                required
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Dyson, GHD, etc."
                data-testid="input-brand"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product, its benefits, and how to use it..."
              rows={4}
              required
              data-testid="textarea-description"
            />
          </div>

          {/* Category and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="29.99"
                required
                data-testid="input-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price ($)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="39.99"
                data-testid="input-original-price"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                placeholder="100"
                min="0"
                data-testid="input-stock-quantity"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isInStock"
                  checked={formData.isInStock}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInStock: checked })}
                  data-testid="switch-in-stock"
                />
                <Label htmlFor="isInStock">In Stock</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDigital"
                  checked={formData.isDigital}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDigital: checked })}
                  data-testid="switch-digital"
                />
                <Label htmlFor="isDigital">Digital Product (e.g., tutorial, guide)</Label>
              </div>
            </div>
          </div>

          {/* Digital Download URL */}
          {formData.isDigital && (
            <div className="space-y-2">
              <Label htmlFor="downloadUrl">Download URL</Label>
              <Input
                id="downloadUrl"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                placeholder="https://example.com/download-link"
                data-testid="input-download-url"
              />
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            <Label>Product Features</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentFeature}
                onChange={(e) => setCurrentFeature(e.target.value)}
                placeholder="Add a product feature"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                data-testid="input-feature"
              />
              <Button type="button" onClick={addFeature} size="sm" data-testid="button-add-feature">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <Badge key={feature} variant="secondary" className="pr-1">
                  {feature}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 w-4 h-4"
                    onClick={() => removeFeature(feature)}
                    data-testid={`button-remove-feature-${feature}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                data-testid="input-tag"
              />
              <Button type="button" onClick={addTag} size="sm" data-testid="button-add-tag">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="pr-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 w-4 h-4"
                    onClick={() => removeTag(tag)}
                    data-testid={`button-remove-tag-${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Media Uploads */}
          <div className="space-y-6">
            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                <Label>Product Images * (Up to 5 images)</Label>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {imageUrls.length < 5 && (
                  <ObjectUploader
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleImageUploadComplete}
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    buttonClassName="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-sm">Add Image</span>
                  </ObjectUploader>
                )}
              </div>
            </div>

            {/* Videos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <Label>Product Videos (Up to 3 videos)</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <video
                      src={url}
                      className="w-full h-32 object-cover rounded-md border"
                      controls
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => removeVideo(index)}
                      data-testid={`button-remove-video-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {videoUrls.length < 3 && (
                  <ObjectUploader
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleVideoUploadComplete}
                    maxNumberOfFiles={1}
                    maxFileSize={52428800} // 50MB for videos
                    buttonClassName="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center"
                  >
                    <Video className="w-6 h-6 mb-2" />
                    <span className="text-sm">Add Video</span>
                  </ObjectUploader>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              data-testid="switch-active"
            />
            <Label htmlFor="isActive">Make this product visible in marketplace</Label>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createProductMutation.isPending}
            data-testid="button-submit"
          >
            {createProductMutation.isPending ? "Uploading Product..." : "Upload Product to Marketplace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}