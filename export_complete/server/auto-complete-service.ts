import { db } from "./db";
import { bookings, providers, providerPayouts } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendRazorpayPayout } from "./razorpay";
import { sendCashfreePayout, sendCashfreeUpiPayout, isCashfreeConfigured } from "./cashfree";
import { log } from "./vite";

const AUTO_COMPLETE_INTERVAL = 15 * 60 * 1000; // Run every 15 minutes
const COMPLETION_BUFFER_MINUTES = 5; // Auto-complete 5 minutes after service ends

export function startAutoCompleteService() {
  log("[AUTO-COMPLETE] Starting automatic service completion service (BACKUP SYSTEM)");
  log(`[AUTO-COMPLETE] NOTE: Instant payouts are triggered immediately after payment`);
  log(`[AUTO-COMPLETE] This service handles edge cases and completes bookings as a safety net`);
  log(`[AUTO-COMPLETE] Running every ${AUTO_COMPLETE_INTERVAL / 1000 / 60} minutes`);
  log(`[AUTO-COMPLETE] Services auto-complete ${COMPLETION_BUFFER_MINUTES} minutes after end time`);

  // Run immediately on startup
  runAutoComplete();

  // Then run on interval
  setInterval(() => {
    runAutoComplete();
  }, AUTO_COMPLETE_INTERVAL);
}

async function runAutoComplete() {
  try {
    const now = new Date();
    const completionThreshold = new Date(now.getTime() - COMPLETION_BUFFER_MINUTES * 60 * 1000);

    log(`[AUTO-COMPLETE] Checking for services to auto-complete (threshold: ${completionThreshold.toISOString()})`);

    // Find all bookings that should be auto-completed
    // NOTE: This is a BACKUP system. Primary payouts happen instantly after payment.
    // This catches edge cases where instant payout may have failed.
    // Criteria:
    // 1. Status is "confirmed" (service happened)
    // 2. appointmentEndTime + 30 minutes has passed
    // 3. Payment method is "online"
    // 4. Payment status is "paid"
    const bookingsToComplete = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          eq(bookings.paymentMethod, "online"),
          eq(bookings.paymentStatus, "paid"),
          lt(bookings.appointmentEndTime, completionThreshold)
        )
      );

    if (bookingsToComplete.length === 0) {
      log("[AUTO-COMPLETE] No bookings to auto-complete");
      return;
    }

    log(`[AUTO-COMPLETE] Found ${bookingsToComplete.length} booking(s) to auto-complete`);

    for (const booking of bookingsToComplete) {
      try {
        log(`[AUTO-COMPLETE] Processing booking ${booking.id} (Token: ${booking.tokenNumber})`);

        // Get provider details for payout
        const servicePrice = parseFloat(booking.servicePrice || "0");
        const platformFee = parseFloat(booking.platformFee || "0");

        if (servicePrice <= 0) {
          log(`[AUTO-COMPLETE] Skipping booking ${booking.id} - invalid service price`);
          continue;
        }

        // Mark booking as completed
        // Assume service finished on time (actualEndTime = scheduledEndTime)
        // If service ran overtime, provider will manually update actualEndTime
        await db
          .update(bookings)
          .set({ 
            status: "completed",
            actualEndTime: booking.appointmentEndTime || booking.appointmentDate,
          })
          .where(eq(bookings.id, booking.id));

        log(`[AUTO-COMPLETE] ✅ Booking ${booking.id} marked as completed (on-time completion assumed)`);

        // Trigger RazorpayX payout to provider (BACKUP - instant payout should have already happened)
        try {
          // Fetch provider payment details (UPI or bank account)
          const [provider] = await db.select().from(providers).where(eq(providers.id, booking.providerId)).limit(1);
          
          // Check if provider has UPI ID (simpler, faster, preferred)
          const hasUpi = provider && provider.upiId;
          const hasBankDetails = provider && provider.accountNumber && provider.ifscCode && provider.accountHolderName;
          
          if (hasUpi || hasBankDetails) {
            // Try Cashfree first (preferred), fallback to RazorpayX
            const useCashfree = isCashfreeConfigured();
            const paymentMethodType = hasUpi ? 'UPI' : 'Bank Account';
            log(`[AUTO-COMPLETE] Provider has ${paymentMethodType}, attempting ${useCashfree ? 'Cashfree' : 'RazorpayX'} payout`);
            
            let payoutResult: any;
            let paymentMethod = 'manual';
            
            if (useCashfree && hasUpi) {
              // PREFERRED: Use Cashfree UPI Payout
              log(`[AUTO-COMPLETE] Using Cashfree UPI payout to ${provider.upiId}`);
              payoutResult = await sendCashfreeUpiPayout(
                booking.id,
                booking.providerId,
                servicePrice,
                {
                  upiId: provider.upiId,
                  phone: provider.phone || undefined
                }
              );
              paymentMethod = 'cashfree_upi';
            } else if (useCashfree && hasBankDetails) {
              // Use Cashfree Bank Account Payout
              log(`[AUTO-COMPLETE] Using Cashfree bank transfer to ${provider.accountNumber}`);
              payoutResult = await sendCashfreePayout(
                booking.id,
                booking.providerId,
                servicePrice,
                {
                  accountHolderName: provider.accountHolderName,
                  accountNumber: provider.accountNumber,
                  ifscCode: provider.ifscCode,
                  phone: provider.phone || undefined,
                  email: provider.email || undefined
                }
              );
              paymentMethod = 'cashfree_imps';
            } else if (hasBankDetails) {
              // Fallback to RazorpayX (bank account only, no UPI support)
              log(`[AUTO-COMPLETE] Using RazorpayX bank transfer to ${provider.accountNumber}`);
              payoutResult = await sendRazorpayPayout(
                booking.id,
                booking.providerId,
                servicePrice,
                {
                  accountHolderName: provider.accountHolderName,
                  accountNumber: provider.accountNumber,
                  ifscCode: provider.ifscCode,
                  phone: provider.phone || undefined,
                  email: provider.email || undefined,
                  fundAccountId: provider.razorpayFundAccountId || undefined
                }
              );
              paymentMethod = 'razorpayx_imps';
              
              // Store RazorpayX fund account ID for future
              if (payoutResult.fundAccountId && !provider.razorpayFundAccountId) {
                await db.update(providers)
                  .set({ razorpayFundAccountId: payoutResult.fundAccountId })
                  .where(eq(providers.id, booking.providerId));
              }
            } else {
              throw new Error('No valid payout method: UPI ID preferred, bank account as fallback');
            }
            
            // Record successful payout
            await db.insert(providerPayouts).values({
              providerId: booking.providerId,
              bookingId: booking.id,
              providerAmount: booking.servicePrice || '0',
              platformFee: booking.platformFee || '0',
              totalReceived: booking.totalPrice || '0',
              status: 'completed',
              paymentMethod: paymentMethod,
              transactionReference: payoutResult.transferId || payoutResult.payoutId,
              notes: `Auto-complete ${useCashfree ? 'Cashfree' : 'RazorpayX'} payout - Reference: ${payoutResult.referenceId || payoutResult.utr || 'pending'}`,
              paidAt: new Date(),
            });
            
            log(`[AUTO-COMPLETE] 💰 Payout successful: ₹${servicePrice} to provider ${booking.providerId} (${useCashfree ? 'Cashfree' : 'RazorpayX'} ID: ${payoutResult.transferId || payoutResult.payoutId})`);
          } else {
            log(`[AUTO-COMPLETE] ⚠️ Provider bank details missing - manual payout required`);
          }
        } catch (payoutError: any) {
          // Payout failed but booking is still completed
          // This might happen if RazorpayX is not configured or provider has invalid bank details
          log(`[AUTO-COMPLETE] ⚠️ Payout failed for booking ${booking.id}: ${payoutError.message}`);
          log(`[AUTO-COMPLETE] Booking marked complete, but manual payout may be needed`);
        }

      } catch (error: any) {
        log(`[AUTO-COMPLETE] ❌ Error processing booking ${booking.id}: ${error.message}`);
      }
    }

    log(`[AUTO-COMPLETE] Completed processing ${bookingsToComplete.length} booking(s)`);
  } catch (error: any) {
    log(`[AUTO-COMPLETE] ❌ Error in auto-complete service: ${error.message}`);
  }
}

// Export for manual triggering if needed
export { runAutoComplete };
