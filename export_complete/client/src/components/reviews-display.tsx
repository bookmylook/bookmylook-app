import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, ThumbsUp, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

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

interface ReviewsDisplayProps {
  providerId: string;
}

export function ReviewsDisplay({ providerId }: ReviewsDisplayProps) {
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/provider", providerId],
  });

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    if (filterRating !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(filterRating)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "helpful":
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const renderStars = (rating: number, size?: "sm" | "md" | "lg") => {
    const starSize = size || "md";
    const sizeClasses: Record<string, string> = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[starSize]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const distribution = getRatingDistribution();
  const filteredReviews = getFilteredAndSortedReviews();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Be the first to review this salon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="reviews-container">
      {/* Overall Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="text-5xl font-bold text-gray-800 dark:text-white">
                  {getAverageRating()}
                </span>
                <div>
                  {renderStars(Math.round(parseFloat(getAverageRating())), "lg")}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Based on {reviews.length} review{reviews.length !== 1 && "s"}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8 text-gray-600 dark:text-gray-400">
                    {rating} ★
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${
                          reviews.length > 0
                            ? (distribution[rating as keyof typeof distribution] /
                                reviews.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm w-8 text-gray-600 dark:text-gray-400">
                    {distribution[rating as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-rating">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-sort-reviews">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No reviews match your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} data-testid={`review-card-${review.id}`}>
              <CardContent className="p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {review.client?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {review.client?.name || "Anonymous"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating, "sm")}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {review.comment}
                </p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                    {review.images.map((image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`Review image ${idx + 1}`}
                        className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        data-testid={`review-image-${review.id}-${idx}`}
                      />
                    ))}
                  </div>
                )}

                {/* Provider Response */}
                {review.providerResponse && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                          Response from salon
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

                {/* Review Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-purple-600"
                    data-testid={`button-helpful-${review.id}`}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ""}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
