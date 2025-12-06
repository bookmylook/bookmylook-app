import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  clientId: string;
  providerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  images?: string[];
  providerResponse?: string;
  providerResponseDate?: string;
  helpfulCount?: number;
  status: string;
  createdAt: string;
  client?: {
    name: string;
    phone: string;
  };
}

interface ProviderReviewsManagerProps {
  providerId: string;
}

export function ProviderReviewsManager({ providerId }: ProviderReviewsManagerProps) {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/provider", providerId],
  });

  const responseMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const res = await apiRequest(`/api/reviews/${reviewId}/respond`, "PATCH", {
        providerResponse: response,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/provider", providerId] });
      toast({
        title: "Response Added",
        description: "Your response has been posted successfully.",
      });
      setResponseText({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const handleAddResponse = (reviewId: string) => {
    const response = responseText[reviewId]?.trim();
    if (!response) return;
    
    responseMutation.mutate({ reviewId, response });
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Reviews</CardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-bold">{getAverageRating()}</span>
              <span className="text-sm text-gray-600">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Reviews from your customers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isExpanded = expandedReviews.has(review.id);
              const hasResponse = !!review.providerResponse;
              
              return (
                <Card key={review.id} data-testid={`provider-review-${review.id}`}>
                  <CardContent className="p-4">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {review.client?.name?.charAt(0)?.toUpperCase() || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {review.client?.name || "Customer"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.status === "verified" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Review Content */}
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {review.comment}
                    </p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {review.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`Review image ${idx + 1}`}
                            className="rounded-lg w-full h-20 object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* Existing Provider Response */}
                    {hasResponse && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                        <div className="flex items-start gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                              Your Response
                            </p>
                            {review.providerResponseDate && (
                              <p className="text-xs text-purple-600 dark:text-purple-400">
                                {format(new Date(review.providerResponseDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 ml-6">
                          {review.providerResponse}
                        </p>
                      </div>
                    )}

                    {/* Add Response Section */}
                    {!hasResponse && (
                      <>
                        {!isExpanded ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(review.id)}
                            className="mt-2"
                            data-testid={`button-respond-${review.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Respond to Review
                          </Button>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Write your response..."
                              value={responseText[review.id] || ""}
                              onChange={(e) =>
                                setResponseText({ ...responseText, [review.id]: e.target.value })
                              }
                              className="min-h-[80px]"
                              data-testid={`textarea-response-${review.id}`}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddResponse(review.id)}
                                disabled={
                                  !responseText[review.id]?.trim() || responseMutation.isPending
                                }
                                className="bg-purple-600 hover:bg-purple-700"
                                data-testid={`button-submit-response-${review.id}`}
                              >
                                {responseMutation.isPending ? "Posting..." : "Post Response"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toggleExpanded(review.id);
                                  setResponseText({ ...responseText, [review.id]: "" });
                                }}
                                data-testid={`button-cancel-response-${review.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
