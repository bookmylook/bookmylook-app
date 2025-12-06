import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const upiSchema = z.object({
  upiId: z.string()
    .min(3, "UPI ID is required")
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format (e.g., yourname@paytm, 9876543210@ybl)")
    .toLowerCase(),
  phone: z.string().min(10, "Phone number is required for verification"),
});

type UpiForm = z.infer<typeof upiSchema>;

interface UpiRegistrationFormProps {
  providerId: string;
  currentUpiId?: string | null;
  currentPhone?: string | null;
  onSuccess?: () => void;
}

export default function UpiRegistrationForm({ 
  providerId, 
  currentUpiId, 
  currentPhone,
  onSuccess 
}: UpiRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpiForm>({
    resolver: zodResolver(upiSchema),
    defaultValues: {
      upiId: currentUpiId || "",
      phone: currentPhone || "",
    },
  });

  const onSubmit = async (data: UpiForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/providers/${providerId}/upi-details`, data);
      
      toast({
        title: "UPI Details Saved",
        description: "Your payment information has been saved successfully. Payments will be sent to your UPI ID instantly.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update UPI details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-500" />
          UPI Payment Details
        </CardTitle>
        <CardDescription>
          Enter your UPI ID to receive instant payments (₹ transferred within seconds, 24x7)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* UPI ID Input */}
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID *</Label>
            <Input
              id="upiId"
              {...form.register("upiId")}
              placeholder="yourname@paytm, 9876543210@ybl, salon@okaxis"
              className="text-lg"
              data-testid="input-upi-id"
            />
            {form.formState.errors.upiId && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {form.formState.errors.upiId.message}
              </p>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Where to find your UPI ID?</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Open PhonePe/Paytm/Google Pay</li>
                <li>Go to Profile → Your UPI ID</li>
                <li>It looks like: <code className="bg-blue-100 px-1 rounded">yourname@paytm</code></li>
              </ul>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone *</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="9876543210"
              type="tel"
              maxLength={10}
              data-testid="input-phone"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-2">Why UPI is Better:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>✅ <strong>Instant payments</strong> - Get paid within seconds after service completion</li>
                  <li>✅ <strong>24x7 availability</strong> - Works anytime, even holidays</li>
                  <li>✅ <strong>No bank details needed</strong> - Just your UPI ID</li>
                  <li>✅ <strong>Secure</strong> - Direct to your account</li>
                  <li>✅ <strong>Up to ₹1 lakh per transaction</strong> - More than enough for salon bookings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p>Your UPI details are encrypted and stored securely. Only you can view and edit this information.</p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            data-testid="button-save-upi-details"
          >
            {isSubmitting ? "Saving..." : "Save UPI Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
