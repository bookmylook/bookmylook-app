import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Percent, Star, Clock } from "lucide-react";
import { format } from "date-fns";

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: string;
  maxDiscount: string | null;
  validFrom: string;
  validUntil: string;
  minBookingAmount: string | null;
  targetUserType: string | null;
  currentRedemptions: number;
  maxRedemptions: number | null;
}

export function OffersDisplay() {
  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/loyalty/offers"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="offers-display">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Gift className="h-6 w-6 text-primary" />
        Special Offers
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <Card
            key={offer.id}
            className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-2 border-primary/20 hover:border-primary/40 transition-colors"
            data-testid={`offer-${offer.id}`}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="default" className="bg-primary">
                    {offer.targetUserType === "new_users" ? "New Users" : "All Users"}
                  </Badge>
                  {offer.discountType === "percentage" ? (
                    <Percent className="h-5 w-5 text-primary" />
                  ) : offer.discountType === "points_multiplier" ? (
                    <Star className="h-5 w-5 text-primary" />
                  ) : (
                    <Gift className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg" data-testid={`text-offer-title-${offer.id}`}>
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {offer.description}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {offer.discountType === "percentage" ? (
                        <>{offer.discountValue}% OFF</>
                      ) : offer.discountType === "fixed_amount" ? (
                        <>₹{offer.discountValue} OFF</>
                      ) : (
                        <>{offer.discountValue}x Points</>
                      )}
                    </div>
                    {offer.maxDiscount && offer.discountType === "percentage" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Max discount ₹{offer.maxDiscount}
                      </div>
                    )}
                  </div>
                </div>

                {offer.minBookingAmount && (
                  <div className="text-xs text-muted-foreground">
                    Min. booking: ₹{offer.minBookingAmount}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Valid till {format(new Date(offer.validUntil), "MMM d")}
                  </div>
                  {offer.maxRedemptions && (
                    <div>
                      {offer.currentRedemptions}/{offer.maxRedemptions} used
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
