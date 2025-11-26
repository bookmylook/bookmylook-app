import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    // Get error details from URL query params
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const reason = params.get('reason');
    
    setErrorDetails({
      orderId,
      reason: reason || 'Payment failed',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto p-4 py-12">
        <Card className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-red-800">
              Payment Failed
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-gray-700">
              We couldn't process your payment.
            </p>
            
            {errorDetails && (
              <div className="bg-white rounded-lg p-4 space-y-2 text-left">
                <h3 className="font-semibold text-gray-800 mb-3">Error Details:</h3>
                
                {errorDetails.orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-sm">{errorDetails.orderId}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Reason:</span>
                  <span className="text-sm text-red-600">{errorDetails.reason}</span>
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Your booking has been created but payment is pending.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                You can still attend your appointment and pay at the salon.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => setLocation("/booking")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-retry-payment"
              >
                Try Again
              </Button>
              
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="flex-1"
                data-testid="button-view-bookings"
              >
                View My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
