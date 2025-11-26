import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Check, Clock, CreditCard, Banknote, RefreshCw, AlertCircle, Copy, Building2, User, Phone } from "lucide-react";
import { format } from "date-fns";

interface ProviderPayoutsManagerProps {
  adminToken: string;
}

interface PendingPayout {
  booking: {
    id: string;
    providerId: string;
    clientName: string;
    clientPhone: string;
    servicePrice: string;
    platformFee: string;
    totalPrice: string;
    appointmentDate: string;
    status: string;
    paymentStatus: string;
    razorpayPaymentId: string;
    createdAt: string;
  };
  provider: {
    id: string;
    businessName: string;
    phone: string;
    bankName: string | null;
    accountHolderName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
    upiId: string | null;
  };
}

interface PayoutRecord {
  payout: {
    id: string;
    providerId: string;
    bookingId: string;
    providerAmount: string;
    platformFee: string;
    totalReceived: string;
    status: string;
    paymentMethod: string;
    transactionReference: string;
    notes: string;
    paidAt: string;
    createdAt: string;
  };
  provider: {
    id: string;
    businessName: string;
    phone: string;
  };
  booking: {
    id: string;
    clientName: string;
    appointmentDate: string;
  };
}

interface PayoutSummary {
  providerId: string;
  providerName: string;
  providerPhone: string;
  totalPending: number;
  bookingCount: number;
}

function CopyableField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied!`, description: value });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}:</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${highlight ? 'font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded' : ''}`}>
          {value}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0" 
          onClick={copyToClipboard}
          data-testid={`button-copy-${label.toLowerCase().replace(/\s/g, '-')}`}
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function ProviderPayoutsManager({ adminToken }: ProviderPayoutsManagerProps) {
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: pendingPayouts, isLoading: loadingPending, refetch: refetchPending } = useQuery<PendingPayout[]>({
    queryKey: ['/api/admin/pending-payouts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/pending-payouts', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending payouts');
      return res.json();
    }
  });

  const { data: payoutHistory, isLoading: loadingHistory, refetch: refetchHistory } = useQuery<PayoutRecord[]>({
    queryKey: ['/api/admin/payouts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/payouts', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payout history');
      return res.json();
    }
  });

  const { data: payoutSummary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery<PayoutSummary[]>({
    queryKey: ['/api/admin/payouts/summary'],
    queryFn: async () => {
      const res = await fetch('/api/admin/payouts/summary', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payout summary');
      return res.json();
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async (data: { bookingId: string; paymentMethod: string; transactionReference: string; notes: string }) => {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to record payout');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout recorded successfully" });
      setDialogOpen(false);
      setSelectedPayout(null);
      setTransactionReference("");
      setNotes("");
      refetchPending();
      refetchHistory();
      refetchSummary();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleMarkPaid = () => {
    if (!selectedPayout) return;
    markPaidMutation.mutate({
      bookingId: selectedPayout.booking.id,
      paymentMethod,
      transactionReference,
      notes
    });
  };

  const openPayDialog = (payout: PendingPayout) => {
    setSelectedPayout(payout);
    setDialogOpen(true);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toFixed(2)}`;
  };

  const totalPendingAmount = pendingPayouts?.reduce((sum, p) => sum + parseFloat(p.booking.servicePrice || '0'), 0) || 0;
  const totalPlatformFees = pendingPayouts?.reduce((sum, p) => sum + parseFloat(p.booking.platformFee || '0'), 0) || 0;

  return (
    <div className="space-y-6 mt-4">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-green-600" />
            Provider Payouts Dashboard
          </CardTitle>
          <CardDescription>
            Track and manage manual payments to providers. Use this when Razorpay Route is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">Pending Payouts</div>
              <div className="text-2xl font-bold text-orange-600">{pendingPayouts?.length || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">Total Pending Amount</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPendingAmount)}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">Platform Fees Earned</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlatformFees)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Pending ({pendingPayouts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="summary">
            Provider Summary
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Check className="w-4 h-4" />
            Completed ({payoutHistory?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Provider Payments</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchPending()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8">Loading...</div>
              ) : pendingPayouts?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  All payments are settled!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount to Pay</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Razorpay ID</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts?.map((payout) => (
                      <TableRow key={payout.booking.id}>
                        <TableCell>
                          <div className="font-medium">{payout.provider?.businessName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{payout.provider?.phone}</div>
                        </TableCell>
                        <TableCell>
                          {payout.booking.appointmentDate ? format(new Date(payout.booking.appointmentDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>{payout.booking.clientName}</div>
                          <div className="text-sm text-gray-500">{payout.booking.clientPhone}</div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payout.booking.servicePrice)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(payout.booking.platformFee)}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {payout.booking.razorpayPaymentId?.substring(0, 15)}...
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => openPayDialog(payout)}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-mark-paid-${payout.booking.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments by Provider</CardTitle>
              <CardDescription>
                Summary of amounts pending for each provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="text-center py-8">Loading...</div>
              ) : payoutSummary?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending payments
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Pending Bookings</TableHead>
                      <TableHead>Total Amount Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutSummary?.map((summary) => (
                      <TableRow key={summary.providerId}>
                        <TableCell className="font-medium">{summary.providerName}</TableCell>
                        <TableCell>{summary.providerPhone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{summary.bookingCount} bookings</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600 text-lg">
                          {formatCurrency(summary.totalPending)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Completed Payouts</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">Loading...</div>
              ) : payoutHistory?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payout history yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Paid On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutHistory?.map((record) => (
                      <TableRow key={record.payout.id}>
                        <TableCell>
                          <div className="font-medium">{record.provider?.businessName || 'Unknown'}</div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(record.payout.providerAmount)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(record.payout.platformFee)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.payout.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {record.payout.transactionReference || '-'}
                        </TableCell>
                        <TableCell>
                          {record.payout.paidAt ? format(new Date(record.payout.paidAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              Pay Provider
            </DialogTitle>
            <DialogDescription>
              Transfer the amount and record the payment
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayout && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Amount to Pay</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(selectedPayout.booking.servicePrice)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Platform fee: {formatCurrency(selectedPayout.booking.platformFee)} (kept by you)
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-800 font-semibold">
                  <Building2 className="w-4 h-4" />
                  Provider Bank Details
                </div>
                
                {selectedPayout.provider?.upiId && (
                  <CopyableField 
                    label="UPI ID" 
                    value={selectedPayout.provider.upiId} 
                    highlight={true}
                  />
                )}
                
                {selectedPayout.provider?.accountNumber ? (
                  <>
                    <CopyableField 
                      label="Account Holder" 
                      value={selectedPayout.provider.accountHolderName || selectedPayout.provider.businessName} 
                    />
                    <CopyableField 
                      label="Bank Name" 
                      value={selectedPayout.provider.bankName || 'Not provided'} 
                    />
                    <CopyableField 
                      label="Account Number" 
                      value={selectedPayout.provider.accountNumber} 
                      highlight={true}
                    />
                    <CopyableField 
                      label="IFSC Code" 
                      value={selectedPayout.provider.ifscCode || 'Not provided'} 
                      highlight={true}
                    />
                  </>
                ) : (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Bank details not added by provider. Contact: {selectedPayout.provider?.phone}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Transaction Reference / UTR</label>
                  <Input
                    placeholder="Enter transaction ID or UTR number"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    data-testid="input-transaction-reference"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Input
                    placeholder="Any additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-payout-notes"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkPaid} 
              disabled={markPaidMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-payout"
            >
              {markPaidMutation.isPending ? 'Recording...' : 'Confirm Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Manual Payout Process</p>
              <p className="text-yellow-700 mt-1">
                Until Razorpay Route is activated (requires ₹40 lakh turnover), you need to manually transfer provider earnings:
              </p>
              <ol className="list-decimal list-inside mt-2 text-yellow-700 space-y-1">
                <li>Check pending payouts above</li>
                <li>Transfer amount to provider's bank/UPI</li>
                <li>Click "Mark Paid" and enter transaction reference</li>
                <li>Keep records for accounting</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
