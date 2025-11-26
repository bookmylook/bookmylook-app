import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { ProviderWithServices } from "@shared/schema";
import PaymentMethodsDisplay from "@/components/payment-methods-display";

interface ProviderCardProps {
  provider: ProviderWithServices;
}

interface Review {
  rating: number;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const startingPrice = provider.services.length > 0 
    ? Math.min(...provider.services.map(service => parseFloat(service.price))) 
    : 0;

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews/provider", provider.id],
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Link href={`/booking?providerId=${provider.id}`}>
      <Card className="bg-gradient-card backdrop-blur-sm border border-white/20 overflow-hidden hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer" data-testid={`card-provider-${provider.id}`}>
      <div className="relative">
        <img 
          src={provider.portfolio?.[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"} 
          alt={`${provider.businessName} work`} 
          className="w-full h-48 object-cover"
        />
        {provider.verified && (
          <Badge className="absolute top-4 left-4 bg-professional-teal text-white">
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center mb-3">
          <img 
            src={provider.profileImage || "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
            alt={`${provider.user?.firstName} ${provider.user?.lastName}`} 
            className="w-12 h-12 rounded-full object-cover mr-3"
          />
          <div>
            <h3 className="font-semibold text-gray-800">{provider.user?.firstName} {provider.user?.lastName}</h3>
            <p className="text-sm text-gray-600">{provider.businessName}</p>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {provider.description}
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {provider.location}
          </div>
          <div className="text-sm font-medium text-professional-teal">
            Starting at ${startingPrice}
          </div>
        </div>

        {avgRating && (
          <div className="flex items-center gap-1 mb-4">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-800">{avgRating}</span>
            <span className="text-xs text-gray-500">({reviews.length} reviews)</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mb-4">
          {(provider.specialties || []).slice(0, 2).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {(provider.specialties || []).length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{(provider.specialties || []).length - 2}
            </Badge>
          )}
        </div>

        <PaymentMethodsDisplay 
          acceptsCash={provider.acceptsCash ?? true}
          acceptsCard={provider.acceptsCard ?? false}
          acceptsTransfer={provider.acceptsTransfer ?? false}
          bankName={provider.bankName ?? undefined}
          className="mb-4"
        />
        
        <Button 
          className="w-full bg-professional-teal text-white hover:bg-professional-teal/90"
          data-testid={`button-book-${provider.id}`}
        >
          Book Now
        </Button>
      </CardContent>
    </Card>
    </Link>
  );
}
