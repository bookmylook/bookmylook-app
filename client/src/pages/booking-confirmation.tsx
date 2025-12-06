import { useEffect, useState } from "react";
import { useLocation, useRoute, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

console.log("🔍 BookingConfirmation component file loaded!");

export default function BookingConfirmation() {
  console.log("🎯 BookingConfirmation component rendering!");
  
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const bookingId = params.id || "";
  const { toast } = useToast();

  console.log("📍 Component params:", params, "bookingId:", bookingId);

  useEffect(() => {
    console.log("📍 Booking confirmation page loaded with ID:", bookingId);
  }, [bookingId]);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<any>({
    queryKey: ['/api/bookings', bookingId],
    enabled: !!bookingId,
  });

  // Fetch payment status
  const { data: paymentStatus } = useQuery<any>({
    queryKey: ['/api/payment-status', bookingId],
    enabled: !!bookingId,
    refetchInterval: 3000, // Poll every 3 seconds for payment updates
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  const isPaid = paymentStatus?.status === 'success' || 
                 paymentStatus?.status === 'completed' || 
                 paymentStatus?.paymentStatus === 'completed' ||
                 paymentStatus?.paymentStatus === 'paid' ||
                 booking?.paymentStatus === 'paid';
  const isPending = paymentStatus?.status === 'pending' || 
                    paymentStatus?.paymentStatus === 'pending' ||
                    booking?.paymentStatus === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto p-4 py-12">
        <Card className={`bg-gradient-to-br ${isPaid ? 'from-green-50 to-white border-green-300' : 'from-yellow-50 to-white border-yellow-300'} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 ${isPaid ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
                {isPaid ? (
                  <CheckCircle className="w-12 h-12 text-white" />
                ) : (
                  <Clock className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
            <CardTitle className={`text-3xl font-bold ${isPaid ? 'text-green-800' : 'text-yellow-800'}`}>
              {isPaid ? 'Booking Confirmed!' : 'Payment Processing...'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isPending && (
              <div className="bg-yellow-100 rounded-lg p-4 text-center">
                <p className="text-yellow-800">
                  ⏳ We're confirming your payment...
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  This may take a few moments
                </p>
              </div>
            )}

            {isPaid && (
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <p className="text-green-800">
                  ✓ Payment received successfully!
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Your appointment is confirmed
                </p>
              </div>
            )}

            {booking && (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 text-lg mb-3">Booking Details:</h3>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono text-sm">{booking.id}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{booking.appointmentDate}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold">{booking.appointmentTime}</span>
                </div>
                
                {(booking.totalAmount || booking.totalPrice) && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">₹{booking.totalAmount || booking.totalPrice}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-semibold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isPaid ? 'Paid' : 'Processing'}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                📱 You will receive a confirmation SMS shortly with your appointment details.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => setLocation("/dashboard")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-view-bookings"
              >
                View My Bookings
              </Button>
              
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="flex-1"
                data-testid="button-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
