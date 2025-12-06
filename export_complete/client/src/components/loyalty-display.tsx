import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Gift, Star, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PRODUCTION_API_URL } from "@/lib/config";

interface LoyaltyData {
  balance: number;
  referralCode: string;
  transactions: Array<{
    id: string;
    points: number;
    type: string;
    description: string;
    createdAt: string;
    balanceBefore: number;
    balanceAfter: number;
  }>;
}

export function LoyaltyDisplay() {
  const { toast } = useToast();
  const { data: loyaltyData, isLoading } = useQuery<LoyaltyData>({
    queryKey: ["/api/loyalty/balance"],
  });

  const handleShareReferral = async () => {
    const appUrl = PRODUCTION_API_URL;
    const referralLink = `${appUrl}?ref=${loyaltyData?.referralCode}`;
    const message = `🎁 Join BookMyLook with my referral code ${loyaltyData?.referralCode} and get 50 bonus points! ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join BookMyLook",
          text: message,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(message);
      toast({
        title: "Copied to clipboard",
        description: "Referral message copied! Share it with your friends.",
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(loyaltyData?.referralCode || "");
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
        <div className="h-60 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const pointsValue = (loyaltyData?.balance || 0);
  const rupeeValue = pointsValue;

  return (
    <div className="space-y-6" data-testid="loyalty-display">
      <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5" />
            Loyalty Points
          </CardTitle>
          <CardDescription className="text-purple-100">
            Earn 10 points with every booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-5xl font-bold" data-testid="text-points-balance">
                {pointsValue}
              </div>
              <div className="text-sm text-purple-100 mt-1">
                Points (Worth ₹{rupeeValue})
              </div>
            </div>

            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-xs text-purple-100 mb-1">Your Referral Code</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold" data-testid="text-referral-code">
                  {loyaltyData?.referralCode}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="text-white hover:bg-white/20"
                  data-testid="button-copy-code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleShareReferral}
              className="w-full bg-white text-purple-600 hover:bg-purple-50"
              data-testid="button-share-referral"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share & Earn 50 Points
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loyaltyData?.transactions || loyaltyData.transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start booking to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loyaltyData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between py-3 border-b last:border-0"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {transaction.points > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                      )}
                      <span className="font-medium">
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points} points
                      </span>
                      <Badge variant={transaction.points > 0 ? "default" : "secondary"}>
                        {transaction.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(transaction.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">Balance</div>
                    <div className="font-semibold">{transaction.balanceAfter}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle className="text-lg">How to Earn More Points?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
              1
            </div>
            <div>
              <strong>Book appointments:</strong> Earn 10 points with every completed booking
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
              2
            </div>
            <div>
              <strong>Refer friends:</strong> Get 50 points when someone signs up with your code
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
              3
            </div>
            <div>
              <strong>Redeem rewards:</strong> Use 100 points to get ₹100 off your next booking
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
