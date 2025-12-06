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
import { Upload, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface PortfolioUploadProps {
  providerId: string;
  onSuccess?: () => void;
}

const categories = [
  { value: "hair", label: "Hair Services" },
  { value: "nails", label: "Nail Services" },
  { value: "makeup", label: "Makeup" },
  { value: "skincare", label: "Skincare" },
  { value: "massage", label: "Massage" },
  { value: "spa", label: "Spa Services" },
];

const serviceTypes = {
  hair: ["cut", "color", "styling", "treatment", "extensions"],
  nails: ["manicure", "pedicure", "gel", "acrylic", "nail art"],
  makeup: ["bridal", "party", "everyday", "special occasion", "photoshoot"],
  skincare: ["facial", "treatment", "cleansing", "anti-aging", "acne treatment"],
  massage: ["relaxation", "deep tissue", "sports", "therapeutic", "aromatherapy"],
  spa: ["full service", "relaxation package", "couple's spa", "day spa", "wellness"]
};

const occasionTypes = ["wedding", "party", "everyday", "photoshoot", "special event", "holiday"];
const ageRanges = ["teens", "20-30", "30-40", "40-50", "50+"];

export default function PortfolioUpload({ providerId, onSuccess }: PortfolioUploadProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    serviceType: "",
    occasionType: "",
    clientAgeRange: "",
    timeTaken: "",
    isPublic: true,
    isFeatured: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/portfolio", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portfolio item uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      onSuccess?.();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload portfolio item",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      serviceType: "",
      occasionType: "",
      clientAgeRange: "",
      timeTaken: "",
      isPublic: true,
      isFeatured: false,
    });
    setTags([]);
    setCurrentTag("");
    setUploadedImageUrl("");
    setBeforeImageUrl("");
    setVideoUrl("");
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, isBeforeImage = false) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL as string;
      if (isBeforeImage) {
        setBeforeImageUrl(uploadURL);
      } else {
        setUploadedImageUrl(uploadURL);
      }
    }
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
    
    if (!formData.title || !formData.category || !uploadedImageUrl) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and upload an image",
        variant: "destructive",
      });
      return;
    }

    createPortfolioMutation.mutate({
      providerId,
      title: formData.title,
      description: formData.description,
      imageUrl: uploadedImageUrl,
      beforeImageUrl: beforeImageUrl || undefined,
      videoUrl: videoUrl || undefined,
      category: formData.category,
      serviceType: formData.serviceType || undefined,
      occasionType: formData.occasionType || undefined,
      clientAgeRange: formData.clientAgeRange || undefined,
      timeTaken: formData.timeTaken ? parseInt(formData.timeTaken) : undefined,
      tags,
      isPublic: formData.isPublic,
      isFeatured: formData.isFeatured,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Portfolio Item to BookMyLook Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Elegant Bridal Updo"
              required
              data-testid="input-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your work, techniques used, or inspiration..."
              rows={3}
              data-testid="textarea-description"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value, serviceType: "" })}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          {formData.category && (
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select 
                value={formData.serviceType} 
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger data-testid="select-service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes[formData.category as keyof typeof serviceTypes]?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Additional Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select 
                value={formData.occasionType} 
                onValueChange={(value) => setFormData({ ...formData, occasionType: value })}
              >
                <SelectTrigger data-testid="select-occasion">
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  {occasionTypes.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Client Age Range</Label>
              <Select 
                value={formData.clientAgeRange} 
                onValueChange={(value) => setFormData({ ...formData, clientAgeRange: value })}
              >
                <SelectTrigger data-testid="select-age-range">
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeTaken">Time Taken (mins)</Label>
              <Input
                id="timeTaken"
                type="number"
                value={formData.timeTaken}
                onChange={(e) => setFormData({ ...formData, timeTaken: e.target.value })}
                placeholder="e.g., 120"
                min="0"
                data-testid="input-time-taken"
              />
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
                <Badge key={tag} variant="secondary" className="pr-1">
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

          {/* Media Uploads - Images and Videos */}
          <div className="space-y-6">
            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Image *</Label>
                <ObjectUploader
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={(result) => handleUploadComplete(result, false)}
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {uploadedImageUrl ? "Change Image" : "Upload Image"}
                  </div>
                </ObjectUploader>
                {uploadedImageUrl && (
                  <div className="mt-2">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Before Image (Optional)</Label>
                <ObjectUploader
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={(result) => handleUploadComplete(result, true)}
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {beforeImageUrl ? "Change Before Image" : "Upload Before Image"}
                  </div>
                </ObjectUploader>
                {beforeImageUrl && (
                  <div className="mt-2">
                    <img
                      src={beforeImageUrl}
                      alt="Before"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Videos */}
            <div className="space-y-2">
              <Label>Process Video (Optional)</Label>
              <ObjectUploader
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={(result) => {
                  if (result.successful && result.successful.length > 0) {
                    const uploadURL = result.successful[0].uploadURL as string;
                    setVideoUrl(uploadURL);
                  }
                }}
                maxNumberOfFiles={1}
                maxFileSize={52428800} // 50MB for videos
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {videoUrl ? "Change Video" : "Upload Process Video"}
                </div>
              </ObjectUploader>
              {videoUrl && (
                <div className="mt-2">
                  <video
                    src={videoUrl}
                    className="w-full h-48 object-cover rounded-md border"
                    controls
                  />
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                data-testid="switch-public"
              />
              <Label htmlFor="isPublic">Make this portfolio item public</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                data-testid="switch-featured"
              />
              <Label htmlFor="isFeatured">Feature this item (will appear in featured section)</Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createPortfolioMutation.isPending}
            data-testid="button-submit"
          >
            {createPortfolioMutation.isPending ? "Uploading..." : "Upload to BookMyLook Marketplace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}