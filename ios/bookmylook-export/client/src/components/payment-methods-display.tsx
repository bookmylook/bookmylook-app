import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Building2 } from "lucide-react";

interface PaymentMethodsDisplayProps {
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  acceptsTransfer?: boolean;
  bankName?: string;
  className?: string;
}

export default function PaymentMethodsDisplay({ 
  acceptsCash, 
  acceptsCard, 
  acceptsTransfer, 
  bankName, 
  className = "" 
}: PaymentMethodsDisplayProps) {
  const paymentMethods = [];
  
  if (acceptsCash) paymentMethods.push({ icon: "💵", label: "Cash" });
  if (acceptsCard) paymentMethods.push({ icon: "💳", label: "Card" });
  if (acceptsTransfer) paymentMethods.push({ icon: "🏦", label: "Bank Transfer" });

  if (paymentMethods.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Payment methods not configured
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-gray-700">Accepted Payments:</div>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1">
            <span>{method.icon}</span>
            <span>{method.label}</span>
          </Badge>
        ))}
      </div>
      {acceptsTransfer && bankName && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          Bank: {bankName}
        </div>
      )}
    </div>
  );
}