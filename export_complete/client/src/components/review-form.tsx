import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/hooks/useClientAuth";

interface ReviewFormProps {
  bookingId: string;
  providerId: string;
  serviceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewForm({ bookingId, providerId, serviceName, isOpen, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const { client } = useClientAuth();

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string; images: string[] }) => {
      if (!client) {
        throw new Error("You must be logged in to submit a review");
      }
      
      const response = await apiRequest("/api/reviews", "POST", {
        bookingId,
        providerId,
        clientId: client.id,
        rating: data.rating,
        comment: data.comment,
        images: data.images,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setImages([]);
    onClose();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', files[0]);

      const response = await fetch("/api/reviews/upload-image", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const { imageUrl } = await response.json();
      setImages([...images, imageUrl]);
      toast({
        title: "Image Uploaded",
        description: "Your photo has been added to the review",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({ rating, comment, images });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-review-form">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your {serviceName} service?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                  type="button"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {rating} {rating === 1 ? "star" : "stars"}
                </span>
              )}
            </div>
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-comment"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Add Photos (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Review ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    data-testid={`button-remove-image-${index}`}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                    data-testid="input-upload-photo"
                  />
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">Upload up to 5 photos</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitReviewMutation.isPending}
            data-testid="button-cancel-review"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReviewMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-submit-review"
          >
            {submitReviewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
