export interface UpiPaymentOptions {
  upiId: string;
  name: string;
  amount: number;
  note: string;
  transactionId: string;
}

export function openUpiApp(options: UpiPaymentOptions): void {
  const { upiId, name, amount, note, transactionId } = options;
  
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(transactionId)}`;
  
  console.log('[UPI_PAYMENT] Opening UPI app with:', { upiId, name, amount, note, transactionId });
  console.log('[UPI_PAYMENT] UPI URL:', upiUrl);
  
  if (typeof window !== 'undefined') {
    window.location.href = upiUrl;
  }
}

export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `BML${timestamp}${random}`;
}

export interface UpiVerificationData {
  amount: number;
  upiId: string;
  transactionId: string;
  utrNumber: string;
  paymentApp?: string;
}

export function verifyUtrFormat(utr: string): boolean {
  return /^[A-Z0-9]{12,16}$/.test(utr.toUpperCase());
}
