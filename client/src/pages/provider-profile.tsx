import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ReviewsDisplay } from "@/components/reviews-display";
import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, Mail, Calendar, PenSquare } from "lucide-react";
import { ProviderWithServices } from "@shared/schema";
import { useClientAuth } from "@/hooks/useClientAuth";

export default function ProviderProfile() {
  const [, params] = useRoute("/provider/:id");
  const [, setLocation] = useLocation();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<{
    bookingId: string;
    serviceName: string;
  } | null>(null);
  const { client, isAuthenticated } = useClientAuth();

  const { data: provider, isLoading } = useQuery<ProviderWithServices>({
    queryKey: ["/api/providers", params?.id],
  });

  // Fetch user's completed bookings with this provider to check if they can review
  const { data: userBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && !!client,
  });

  // Get completed bookings with this provider that haven't been reviewed
  const completedBookingsForReview = userBookings.filter((booking) => 
    booking.providerId === params?.id && 
    booking.status === "completed" &&
    !booking.hasReview // We'll need to check if review exists
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Provider not found</h1>
            <p className="text-gray-600">The provider you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleBookService = (serviceId: string) => {
    setLocation(`/booking?providerId=${params?.id}&serviceId=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-r from-soft-pink to-warm-beige"></div>
          <div className="p-8">
            <div className="flex items-start gap-6">
              <img
                src={provider.profileImage || "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
                alt={provider.businessName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white -mt-16 relative z-10"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{provider.businessName}</h1>
                  </div>
                  {provider.verified && (
                    <Badge className="bg-professional-teal text-white">Verified</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-1" />
                    {provider.location}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(provider.specialties || []).map((specialty, index) => (
                    <Badge key={index} variant="secondary">{specialty}</Badge>
                  ))}
                  <Badge 
                    key="pricing" 
                    variant="outline" 
                    className="border-green-500 text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer"
                    onClick={() => {
                      // Scroll to services section or show pricing modal
                      const servicesSection = document.getElementById('services-section');
                      if (servicesSection) {
                        servicesSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    💰 View Pricing
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{provider.description}</p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card id="services-section">
              <CardHeader>
                <CardTitle>Services & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {provider.services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                          <p className="text-gray-600 mb-3">{service.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {service.duration} min
                            </div>
                            <Badge>{service.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-professional-teal mb-2">
                            ${service.price}
                          </div>
                          <Button 
                            onClick={() => handleBookService(service.id)}
                            className="bg-professional-teal hover:bg-professional-teal/90"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            {provider.portfolio && provider.portfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {provider.portfolio.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Reviews & Ratings
                </h2>
                {isAuthenticated && client && completedBookingsForReview.length > 0 && (
                  <Button
                    onClick={() => {
                      const booking = completedBookingsForReview[0];
                      setSelectedBookingForReview({
                        bookingId: booking.id,
                        serviceName: booking.service?.name || booking.service?.serviceName || 'Service'
                      });
                      setShowReviewForm(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-write-review"
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                )}
              </div>
              <ReviewsDisplay providerId={provider.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.user?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <a 
                      href={`tel:${provider.user.phone}`}
                      className="text-professional-teal hover:underline"
                      data-testid="link-provider-phone"
                    >
                      {provider.user.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{provider.user?.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{provider.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Book */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-professional-teal hover:bg-professional-teal/90"
                  onClick={() => setLocation(`/booking?providerId=${params?.id}`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const phone = provider.user?.phone?.replace(/\D/g, '');
                    if (phone) {
                      window.open(`https://wa.me/${phone}?text=Hi, I found you on BookMyLook and would like to inquire about your services.`, '_blank');
                    }
                  }}
                  data-testid="button-send-message"
                >
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showReviewForm && selectedBookingForReview && (
        <ReviewForm
          bookingId={selectedBookingForReview.bookingId}
          providerId={provider.id}
          serviceName={selectedBookingForReview.serviceName}
          isOpen={showReviewForm}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedBookingForReview(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
