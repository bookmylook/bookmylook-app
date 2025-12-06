/**
 * ========================================
 * CASHFREE PAYOUTS API V2 IMPLEMENTATION
 * ========================================
 * 
 * This uses Cashfree Payouts API v2 for instant bank transfers
 * 
 * How it works:
 * 1. Client pays ₹515 (service ₹500 + commission ₹15)
 * 2. All ₹515 goes to YOUR Razorpay account
 * 3. This function sends ₹500 to provider's bank via IMPS/UPI (instant)
 * 4. Commission (₹15) automatically stays in your Razorpay account
 * 
 * Requirements:
 * - Sign up at https://www.cashfree.com
 * - Complete business KYC (6 hours activation)
 * - Get API credentials from Merchant Dashboard
 * - Provider must have valid bank details (account number, IFSC, name)
 * - Whitelist server IP in Cashfree dashboard
 * 
 * V2 API Authentication:
 * 1. Get Bearer token from V1 authorize endpoint
 * 2. Use Bearer token + client credentials for V2 API calls
 */

import axios from 'axios';

let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Get Cashfree API configuration
 */
function getCashfreeConfig() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

  if (!clientId || !clientSecret) {
    return null;
  }

  const authURL = environment === 'PRODUCTION'
    ? 'https://payout-api.cashfree.com/payout/v1/authorize'
    : 'https://payout-gamma.cashfree.com/payout/v1/authorize';

  const baseURL = environment === 'PRODUCTION'
    ? 'https://api.cashfree.com/payout'
    : 'https://sandbox.cashfree.com/payout';

  return {
    clientId,
    clientSecret,
    authURL,
    baseURL,
    environment
  };
}

/**
 * Get Bearer token for API calls
 */
async function getAuthToken(): Promise<string> {
  const config = getCashfreeConfig();
  if (!config) {
    throw new Error('Cashfree not configured');
  }

  // Check if we have a valid cached token (with 1 minute buffer)
  if (cachedToken && cachedToken.expiry > Date.now() + 60000) {
    return cachedToken.token;
  }

  console.log('[CASHFREE V2] Getting new auth token...');

  const response = await axios.post(config.authURL, {}, {
    headers: {
      'X-Client-Id': config.clientId,
      'X-Client-Secret': config.clientSecret,
      'Content-Type': 'application/json'
    }
  });

  if (response.data?.status !== 'SUCCESS' || !response.data?.data?.token) {
    throw new Error(`Auth failed: ${response.data?.message || 'Unknown error'}`);
  }

  cachedToken = {
    token: response.data.data.token,
    expiry: response.data.data.expiry * 1000 // Convert to milliseconds
  };

  console.log('[CASHFREE V2] Auth token obtained successfully');
  return cachedToken.token;
}

/**
 * Send instant payout to provider via UPI VPA (UPI ID)
 * This is simpler and faster than bank account transfers
 */
export async function sendCashfreeUpiPayout(
  bookingId: string,
  providerId: string,
  amount: number,
  providerData: {
    upiId: string;
    phone?: string;
  }
): Promise<{
  transferId: string;
  status: string;
  referenceId?: string;
  utr?: string;
  message?: string;
}> {
  const config = getCashfreeConfig();
  
  if (!config) {
    console.warn(`[CASHFREE V2 UPI] Not configured. Manual payout needed: ₹${amount} for booking ${bookingId}`);
    throw new Error(
      `Cashfree not configured. Manual payout needed for booking ${bookingId}: ₹${amount} to provider ${providerId}.`
    );
  }

  if (!providerData.upiId) {
    throw new Error('Provider UPI ID not available.');
  }

  try {
    const token = await getAuthToken();
    const transferId = `BML_UPI_${bookingId.substring(0, 8)}_${Date.now()}`;
    
    console.log(`[CASHFREE V2 UPI] Initiating UPI payout: ₹${amount} to ${providerData.upiId}`);
    console.log(`[CASHFREE V2 UPI] Environment: ${config.environment}`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-client-id': config.clientId,
      'x-client-secret': config.clientSecret,
      'x-api-version': '2024-01-01',
      'Content-Type': 'application/json'
    };

    const transferPayload = {
      transfer_id: transferId,
      transfer_amount: parseFloat(amount.toFixed(2)),
      transfer_mode: 'upi',
      beneficiary_details: {
        beneficiary_vpa: providerData.upiId.toLowerCase(),
        beneficiary_phone: providerData.phone
      }
    };

    console.log('[CASHFREE V2 UPI] Transfer request:', {
      transferId: transferPayload.transfer_id,
      amount: transferPayload.transfer_amount,
      upiId: transferPayload.beneficiary_details.beneficiary_vpa
    });

    const response = await axios.post(`${config.baseURL}/transfers`, transferPayload, { headers });
    
    console.log(`[CASHFREE V2 UPI] Payout SUCCESS:`, {
      transferId: response.data?.transfer_id,
      cfTransferId: response.data?.cf_transfer_id,
      status: response.data?.status,
      message: response.data?.status_description
    });

    return {
      transferId: transferId,
      status: response.data?.status || 'PENDING',
      referenceId: response.data?.cf_transfer_id,
      utr: response.data?.utr,
      message: response.data?.status_description
    };

  } catch (error: any) {
    console.error('[CASHFREE V2 UPI] Payout failed:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const errorCode = error.response?.data?.code || error.response?.status;
    
    console.error('[CASHFREE V2 UPI] Error details:', {
      code: errorCode,
      message: errorMessage,
      providerId,
      amount,
      bookingId
    });

    if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
      throw new Error('Insufficient balance in Cashfree wallet. Please add funds.');
    }
    
    if (errorMessage.includes('invalid') && errorMessage.includes('vpa')) {
      throw new Error('Invalid UPI ID. Please verify the UPI ID.');
    }
    
    if (errorCode === 401 || errorCode === 403 || errorMessage.includes('Token')) {
      cachedToken = null;
      throw new Error('Cashfree authentication failed. Check credentials and IP whitelist.');
    }

    if (errorMessage.includes('IP') || errorMessage.includes('whitelist')) {
      throw new Error('IP not whitelisted. Whitelist at https://merchant.cashfree.com/payouts/developers/two-factor-authentication');
    }
    
    throw new Error(`Cashfree UPI payout failed: ${errorMessage}`);
  }
}

/**
 * Send instant payout to provider using Cashfree Payouts API V2 (Bank Account)
 */
export async function sendCashfreePayout(
  bookingId: string,
  providerId: string,
  amount: number,
  providerData: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    phone?: string;
    email?: string;
  }
): Promise<{
  transferId: string;
  status: string;
  referenceId?: string;
  utr?: string;
  message?: string;
}> {
  const config = getCashfreeConfig();
  
  if (!config) {
    console.warn(`[CASHFREE V2] Not configured. Manual payout needed: ₹${amount} for booking ${bookingId}`);
    throw new Error(
      `Cashfree not configured. Manual payout needed for booking ${bookingId}: ₹${amount} to provider ${providerId}.`
    );
  }

  if (!providerData) {
    throw new Error(`Provider bank details not available for provider ${providerId}`);
  }

  if (!providerData.accountNumber || !providerData.ifscCode || !providerData.accountHolderName) {
    throw new Error('Provider bank details incomplete. Need account number, IFSC code, and account holder name.');
  }

  try {
    const token = await getAuthToken();
    const transferId = `BML_${bookingId.substring(0, 8)}_${Date.now()}`;
    
    console.log(`[CASHFREE V2] Initiating payout: ₹${amount} to ${providerData.accountHolderName} (${providerData.accountNumber})`);
    console.log(`[CASHFREE V2] Environment: ${config.environment}`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-client-id': config.clientId,
      'x-client-secret': config.clientSecret,
      'x-api-version': '2024-01-01',
      'Content-Type': 'application/json'
    };

    const transferPayload = {
      transfer_id: transferId,
      transfer_amount: parseFloat(amount.toFixed(2)),
      transfer_mode: 'banktransfer',
      beneficiary_details: {
        beneficiary_name: providerData.accountHolderName,
        beneficiary_instrument_details: {
          bank_account_number: providerData.accountNumber.replace(/\s/g, ''),
          bank_ifsc: providerData.ifscCode.toUpperCase()
        }
      }
    };

    console.log('[CASHFREE V2] Transfer request:', {
      transferId: transferPayload.transfer_id,
      amount: transferPayload.transfer_amount,
      beneficiary: transferPayload.beneficiary_details.beneficiary_name
    });

    const response = await axios.post(`${config.baseURL}/transfers`, transferPayload, { headers });
    
    console.log(`[CASHFREE V2] Payout SUCCESS:`, {
      transferId: response.data?.transfer_id,
      cfTransferId: response.data?.cf_transfer_id,
      status: response.data?.status,
      message: response.data?.status_description
    });

    return {
      transferId: transferId,
      status: response.data?.status || 'PENDING',
      referenceId: response.data?.cf_transfer_id,
      utr: response.data?.utr,
      message: response.data?.status_description
    };

  } catch (error: any) {
    console.error('[CASHFREE V2] Payout failed:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const errorCode = error.response?.data?.code || error.response?.status;
    
    console.error('[CASHFREE V2] Error details:', {
      code: errorCode,
      message: errorMessage,
      providerId,
      amount,
      bookingId
    });

    if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
      throw new Error('Insufficient balance in Cashfree wallet. Please add funds.');
    }
    
    if (errorMessage.includes('invalid') && errorMessage.includes('bank')) {
      throw new Error('Invalid bank details. Please verify account number and IFSC code.');
    }
    
    if (errorCode === 401 || errorCode === 403 || errorMessage.includes('Token')) {
      cachedToken = null; // Clear cached token
      throw new Error('Cashfree authentication failed. Check credentials and IP whitelist.');
    }

    if (errorMessage.includes('IP') || errorMessage.includes('whitelist')) {
      throw new Error('IP not whitelisted. Whitelist at https://merchant.cashfree.com/payouts/developers/two-factor-authentication');
    }
    
    throw new Error(`Cashfree payout failed: ${errorMessage}`);
  }
}

/**
 * Check payout status from Cashfree V2
 */
export async function getCashfreePayoutStatus(transferId: string): Promise<{
  status: string;
  utr?: string;
  amount?: number;
  message?: string;
}> {
  const config = getCashfreeConfig();
  
  if (!config) {
    throw new Error('Cashfree not configured');
  }

  try {
    const token = await getAuthToken();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-client-id': config.clientId,
      'x-client-secret': config.clientSecret,
      'x-api-version': '2024-01-01',
      'Content-Type': 'application/json'
    };

    const response = await axios.get(`${config.baseURL}/transfers/${transferId}`, { headers });
    
    return {
      status: response.data?.status || 'UNKNOWN',
      utr: response.data?.utr,
      amount: response.data?.transfer_amount,
      message: response.data?.status_description
    };
    
  } catch (error: any) {
    console.error('[CASHFREE V2] Error fetching status:', error.response?.data || error.message);
    throw new Error(`Failed to fetch payout status: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Verify webhook signature from Cashfree
 */
export function verifyCashfreeWebhook(
  signature: string,
  payload: any,
  timestamp: string
): boolean {
  const config = getCashfreeConfig();
  
  if (!config) {
    console.warn('[CASHFREE V2] Cannot verify webhook - not configured');
    return false;
  }

  try {
    const crypto = require('crypto');
    const rawBody = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', config.clientSecret)
      .update(timestamp + rawBody)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('[CASHFREE V2] Webhook verification failed:', error);
    return false;
  }
}

/**
 * Check if Cashfree is configured and ready
 */
export function isCashfreeConfigured(): boolean {
  const config = getCashfreeConfig();
  return config !== null;
}

/**
 * Get Cashfree balance
 */
export async function getCashfreeBalance(): Promise<{
  available: number;
  currency: string;
}> {
  const config = getCashfreeConfig();
  
  if (!config) {
    throw new Error('Cashfree not configured');
  }

  try {
    const token = await getAuthToken();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-client-id': config.clientId,
      'x-client-secret': config.clientSecret,
      'x-api-version': '2024-01-01',
      'Content-Type': 'application/json'
    };

    const response = await axios.get(`${config.baseURL}/balance`, { headers });
    
    return {
      available: response.data?.available_balance || 0,
      currency: 'INR'
    };
    
  } catch (error: any) {
    console.error('[CASHFREE V2] Error fetching balance:', error.response?.data || error.message);
    throw new Error(`Failed to fetch balance: ${error.response?.data?.message || error.message}`);
  }
}
