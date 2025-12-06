import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Get payment details from URL query params
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const txnId = params.get('txnId');
    
    setPaymentDetails({
      orderId,
      txnId,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto p-4 py-12">
        <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-800">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-gray-700">
              Your payment has been processed successfully.
            </p>
            
            {paymentDetails && (
              <div className="bg-white rounded-lg p-4 space-y-2 text-left">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Details:</h3>
                
                {paymentDetails.orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-sm">{paymentDetails.orderId}</span>
                  </div>
                )}
                
                {paymentDetails.txnId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm">{paymentDetails.txnId}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                ✓ Your booking is confirmed and the provider has been notified.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                You will receive a confirmation SMS shortly.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => setLocation("/dashboard")}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
