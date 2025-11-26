import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Building2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const bankDetailsSchema = z.object({
  bankName: z.string().min(2, "Bank name must be at least 2 characters"),
  accountHolderName: z.string().min(2, "Account holder name must be at least 2 characters"),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits"),
  routingNumber: z.string().min(9, "Routing number must be 9 digits").max(9, "Routing number must be 9 digits"),
  swiftCode: z.string().optional(),
  acceptsCash: z.boolean().default(true),
  acceptsCard: z.boolean().default(false),
  acceptsTransfer: z.boolean().default(false),
});

type BankDetailsForm = z.infer<typeof bankDetailsSchema>;

interface BankDetailsFormProps {
  providerId: string;
  currentBankDetails?: Partial<BankDetailsForm> | null;
  onSuccess?: () => void;
}

export default function BankDetailsForm({ providerId, currentBankDetails, onSuccess }: BankDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BankDetailsForm>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: currentBankDetails?.bankName || "",
      accountHolderName: currentBankDetails?.accountHolderName || "",
      accountNumber: currentBankDetails?.accountNumber || "",
      routingNumber: currentBankDetails?.routingNumber || "",
      swiftCode: currentBankDetails?.swiftCode || "",
      acceptsCash: currentBankDetails?.acceptsCash ?? true,
      acceptsCard: currentBankDetails?.acceptsCard ?? false,
      acceptsTransfer: currentBankDetails?.acceptsTransfer ?? false,
    },
  });

  const onSubmit = async (data: BankDetailsForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/providers/${providerId}/bank-details`, data);
      
      toast({
        title: "Bank Details Updated",
        description: "Your payment information has been saved successfully.",
      });

      // Invalidate provider cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bank details",
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
          <Building2 className="w-5 h-5 text-rose-500" />
          Bank Details & Payment Methods
        </CardTitle>
        <CardDescription>
          Set up your payment information so clients can pay for your services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Bank Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  {...form.register("bankName")}
                  placeholder="Chase Bank, Wells Fargo, etc."
                  data-testid="input-bank-name"
                />
                {form.formState.errors.bankName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.bankName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  {...form.register("accountHolderName")}
                  placeholder="Full name on account"
                  data-testid="input-account-holder"
                />
                {form.formState.errors.accountHolderName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.accountHolderName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  {...form.register("accountNumber")}
                  placeholder="1234567890"
                  type="password"
                  data-testid="input-account-number"
                />
                {form.formState.errors.accountNumber && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.accountNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  {...form.register("routingNumber")}
                  placeholder="021000021"
                  maxLength={9}
                  data-testid="input-routing-number"
                />
                {form.formState.errors.routingNumber && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.routingNumber.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="swiftCode">SWIFT Code (Optional - for international transfers)</Label>
                <Input
                  id="swiftCode"
                  {...form.register("swiftCode")}
                  placeholder="CHASUS33"
                  data-testid="input-swift-code"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Accepted Payment Methods
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptsCash"
                  checked={form.watch("acceptsCash")}
                  onCheckedChange={(checked) => form.setValue("acceptsCash", !!checked)}
                  data-testid="checkbox-accepts-cash"
                />
                <Label htmlFor="acceptsCash" className="flex items-center gap-2">
                  💵 Cash payments at appointment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptsCard"
                  checked={form.watch("acceptsCard")}
                  onCheckedChange={(checked) => form.setValue("acceptsCard", !!checked)}
                  data-testid="checkbox-accepts-card"
                />
                <Label htmlFor="acceptsCard" className="flex items-center gap-2">
                  💳 Card payments (requires payment processor)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptsTransfer"
                  checked={form.watch("acceptsTransfer")}
                  onCheckedChange={(checked) => form.setValue("acceptsTransfer", !!checked)}
                  data-testid="checkbox-accepts-transfer"
                />
                <Label htmlFor="acceptsTransfer" className="flex items-center gap-2">
                  🏦 Bank transfers (using above details)
                </Label>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p>Your bank details are encrypted and stored securely. Only you can view and edit this information.</p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
            data-testid="button-save-bank-details"
          >
            {isSubmitting ? "Saving..." : "Save Bank Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}