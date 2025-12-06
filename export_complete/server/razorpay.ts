import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function getRazorpayXInstance() {
  const keyId = process.env.RAZORPAYX_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[RAZORPAYX] Credentials not configured. Payouts will be manual.');
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpayOrder(amount: number, currency: string = "INR", notes: Record<string, any> = {}) {
  try {
    const razorpay = getRazorpayInstance();
    
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `order_${Date.now()}`,
      notes,
    };

    console.log('[RAZORPAY] Creating order with options:', JSON.stringify(options, null, 2));
    const order = await razorpay.orders.create(options);
    console.log('[RAZORPAY] Order created successfully:', order.id);
    return order;
  } catch (error: any) {
    console.error('[RAZORPAY] Error creating order:', error);
    console.error('[RAZORPAY] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      description: error.description
    });
    throw error;
  }
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keySecret) {
    throw new Error("Razorpay key secret not configured");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
}

export async function capturePayment(paymentId: string, amount: number, currency: string = "INR") {
  const razorpay = getRazorpayInstance();
  
  const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);
  return payment;
}

export async function refundPayment(paymentId: string, amount?: number) {
  const razorpay = getRazorpayInstance();
  
  const refundData: any = { payment_id: paymentId };
  if (amount) {
    refundData.amount = Math.round(amount * 100);
  }
  
  const refund = await razorpay.payments.refund(paymentId, refundData);
  return refund;
}

/**
 * ========================================
 * RAZORPAYX PAYOUTS API IMPLEMENTATION
 * ========================================
 * 
 * This uses RazorpayX Payouts API (NOT the old "Razorpay Route")
 * 
 * How it works:
 * 1. Client pays ₹515 (service ₹500 + commission ₹15)
 * 2. All ₹515 goes to YOUR Razorpay account
 * 3. This function sends ₹500 to provider's bank via IMPS/UPI
 * 4. Commission (₹15) automatically stays in your account
 * 
 * Requirements:
 * - Activate RazorpayX in your Razorpay dashboard
 * - Complete business KYC
 * - Add balance to RazorpayX account
 * - Get RazorpayX API credentials (different from regular Razorpay)
 * - Provider must have valid bank details (account number, IFSC, name)
 */

/**
 * Create a Fund Account for a provider's bank account
 * This is required before sending payouts to a new provider
 */
export async function createFundAccount(
  providerId: string,
  accountHolderName: string,
  accountNumber: string,
  ifscCode: string,
  phone?: string,
  email?: string
): Promise<any> {
  const razorpayX = getRazorpayXInstance();
  
  if (!razorpayX) {
    throw new Error('RazorpayX not configured. Set RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET environment variables.');
  }

  try {
    console.log(`[RAZORPAYX] Creating fund account for provider ${providerId}`);
    
    const contactData: any = {
      name: accountHolderName,
      type: 'vendor',
      reference_id: providerId,
      notes: {
        provider_id: providerId
      }
    };
    
    if (email) contactData.email = email;
    if (phone) contactData.contact = phone.replace(/^\+91/, '');

    const contact = await (razorpayX as any).contacts.create(contactData);
    console.log(`[RAZORPAYX] Contact created: ${contact.id}`);

    const fundAccount = await (razorpayX as any).fundAccount.create({
      contact_id: contact.id,
      account_type: 'bank_account',
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber
      }
    });

    console.log(`[RAZORPAYX] Fund account created: ${fundAccount.id}`);
    return {
      contactId: contact.id,
      fundAccountId: fundAccount.id,
      active: fundAccount.active
    };
  } catch (error: any) {
    console.error('[RAZORPAYX] Error creating fund account:', error);
    
    if (error.statusCode === 400) {
      throw new Error(`Invalid bank details: ${error.error?.description || error.message}`);
    }
    
    throw error;
  }
}

/**
 * Send payout to provider using RazorpayX Payouts API
 * 
 * @param bookingId - The booking ID for tracking
 * @param providerId - Provider's ID in our system
 * @param amount - Amount to transfer to provider (in rupees)
 * @param providerData - Provider's bank details
 * @param fundAccountId - RazorpayX fund account ID (optional, will create if not provided)
 */
export async function sendRazorpayPayout(
  bookingId: string,
  providerId: string,
  amount: number,
  providerData?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    phone?: string;
    email?: string;
    fundAccountId?: string;
  }
): Promise<any> {
  const razorpayX = getRazorpayXInstance();
  
  if (!razorpayX) {
    console.warn(`[RAZORPAYX] Not configured. Manual payout needed: ₹${amount} for booking ${bookingId}`);
    throw new Error(
      `RazorpayX not configured. Manual payout needed for booking ${bookingId}: ₹${amount} to provider ${providerId}. Please activate RazorpayX and set RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET.`
    );
  }

  if (!providerData) {
    throw new Error(`Provider bank details not available for provider ${providerId}`);
  }

  try {
    let fundAccountId = providerData.fundAccountId;

    if (!fundAccountId) {
      console.log(`[RAZORPAYX] Creating fund account for first-time payout to provider ${providerId}`);
      const fundAccountResult = await createFundAccount(
        providerId,
        providerData.accountHolderName,
        providerData.accountNumber,
        providerData.ifscCode,
        providerData.phone,
        providerData.email
      );
      fundAccountId = fundAccountResult.fundAccountId;
    }

    console.log(`[RAZORPAYX] Initiating payout: ₹${amount} to fund account ${fundAccountId}`);
    
    const razorpayXAccountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
    if (!razorpayXAccountNumber) {
      throw new Error('RAZORPAYX_ACCOUNT_NUMBER not configured. This is your RazorpayX account number.');
    }

    const payout = await (razorpayX as any).payouts.create({
      account_number: razorpayXAccountNumber,
      fund_account_id: fundAccountId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: bookingId,
      narration: `BookMyLook service payment - Booking ${bookingId}`,
      notes: {
        booking_id: bookingId,
        provider_id: providerId,
        type: 'service_payment'
      }
    });

    console.log(`[RAZORPAYX] Payout created successfully:`, {
      payoutId: payout.id,
      status: payout.status,
      amount: amount,
      provider: providerId,
      booking: bookingId
    });

    return {
      payoutId: payout.id,
      status: payout.status,
      amount: amount,
      fundAccountId: fundAccountId,
      utr: payout.utr || null,
      createdAt: payout.created_at
    };
  } catch (error: any) {
    console.error('[RAZORPAYX] Payout failed:', error);
    
    if (error.statusCode === 400) {
      if (error.error?.description?.includes('balance')) {
        throw new Error(`Insufficient balance in RazorpayX account. Please add funds to your RazorpayX account.`);
      }
      throw new Error(`Payout failed: ${error.error?.description || error.message}`);
    }
    
    if (error.statusCode === 401) {
      throw new Error('RazorpayX authentication failed. Please check your RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET.');
    }
    
    throw error;
  }
}

/**
 * Get payout status from RazorpayX
 */
export async function getPayoutStatus(payoutId: string): Promise<any> {
  const razorpayX = getRazorpayXInstance();
  
  if (!razorpayX) {
    throw new Error('RazorpayX not configured');
  }

  try {
    const payout = await (razorpayX as any).payouts.fetch(payoutId);
    return {
      id: payout.id,
      status: payout.status,
      amount: payout.amount / 100,
      utr: payout.utr,
      mode: payout.mode,
      purpose: payout.purpose,
      createdAt: payout.created_at
    };
  } catch (error: any) {
    console.error('[RAZORPAYX] Error fetching payout status:', error);
    throw error;
  }
}

/**
 * Check if RazorpayX is configured and ready
 */
export function isRazorpayXConfigured(): boolean {
  return !!(process.env.RAZORPAYX_KEY_ID && 
            process.env.RAZORPAYX_KEY_SECRET && 
            process.env.RAZORPAYX_ACCOUNT_NUMBER);
}
