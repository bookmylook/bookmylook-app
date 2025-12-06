import { db } from "./db";
import { bookings, payments, refunds, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { refundPayment } from "./razorpay";
import { permanentSMSService } from "./sms-service";

/**
 * Refund Service - Implements BookMyLook's Official Refund Policy
 * 
 * Policy Summary:
 * 1. Provider cancels after approval → Full refund
 * 2. Customer waits 10+ minutes → Full refund (must report same day)
 * 3. Customer cancels with 1+ hour notice → Full refund
 * 4. Customer cancels with <1 hour notice → NO refund
 * 
 * Processing: 7 working days to original payment method
 */

export interface RefundEligibility {
  eligible: boolean;
  reason: string;
  hoursNotice?: number;
  refundAmount?: number;
}

export interface RefundRequest {
  bookingId: string;
  requestedBy: string; // User ID who requested
  reason: 'provider_cancelled' | 'excessive_wait' | 'customer_cancelled_advance';
  notes?: string;
}

/**
 * Check if a booking cancellation is eligible for refund
 * Based on BookMyLook's official refund policy
 */
export async function checkRefundEligibility(
  bookingId: string,
  cancelledAt: Date = new Date()
): Promise<RefundEligibility> {
  // Get booking details
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return {
      eligible: false,
      reason: "Booking not found"
    };
  }

  // Get payment details
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(
      eq(payments.bookingId, bookingId),
      eq(payments.status, 'completed')
    ));

  if (!payment) {
    return {
      eligible: false,
      reason: "No completed payment found for this booking"
    };
  }

  // Calculate hours of advance notice
  const appointmentTime = new Date(booking.appointmentDate);
  const timeDiff = appointmentTime.getTime() - cancelledAt.getTime();
  const hoursNotice = timeDiff / (1000 * 60 * 60); // Convert milliseconds to hours

  console.log(`📊 Refund Eligibility Check:`, {
    bookingId,
    appointmentTime: appointmentTime.toISOString(),
    cancelledAt: cancelledAt.toISOString(),
    hoursNotice: hoursNotice.toFixed(2),
    bookingStatus: booking.status,
    paymentAmount: payment.amount
  });

  // POLICY RULE: Customer must cancel at least 1 hour before appointment
  if (hoursNotice >= 1) {
    return {
      eligible: true,
      reason: "Cancellation made with sufficient notice (1+ hour)",
      hoursNotice: parseFloat(hoursNotice.toFixed(2)),
      refundAmount: parseFloat(payment.amount)
    };
  } else {
    return {
      eligible: false,
      reason: `Insufficient notice: ${hoursNotice.toFixed(2)} hours (minimum 1 hour required)`,
      hoursNotice: parseFloat(hoursNotice.toFixed(2))
    };
  }
}

/**
 * Process a refund request according to official policy
 */
export async function processRefund(request: RefundRequest): Promise<{
  success: boolean;
  refundId?: string;
  message: string;
  refundAmount?: number;
}> {
  try {
    const { bookingId, requestedBy, reason, notes } = request;

    // Get booking and payment details
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return {
        success: false,
        message: "Booking not found"
      };
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(and(
        eq(payments.bookingId, bookingId),
        eq(payments.status, 'completed')
      ));

    if (!payment) {
      return {
        success: false,
        message: "No completed payment found"
      };
    }

    if (!payment.gatewayTransactionId) {
      return {
        success: false,
        message: "Payment transaction ID not found - cannot process refund"
      };
    }

    // Check refund eligibility
    let eligible: RefundEligibility;
    
    if (reason === 'provider_cancelled' || reason === 'excessive_wait') {
      // Provider cancelled or excessive wait → Automatic full refund
      eligible = {
        eligible: true,
        reason: reason === 'provider_cancelled' 
          ? "Provider cancelled approved booking" 
          : "Customer waited 10+ minutes",
        refundAmount: parseFloat(payment.amount)
      };
    } else {
      // Customer cancellation → Check 1-hour rule
      eligible = await checkRefundEligibility(bookingId);
    }

    if (!eligible.eligible) {
      return {
        success: false,
        message: eligible.reason
      };
    }

    const refundAmount = eligible.refundAmount!;
    const hoursNotice = eligible.hoursNotice || 0;

    console.log(`💰 Processing refund for booking ${bookingId}:`, {
      reason,
      amount: refundAmount,
      paymentId: payment.gatewayTransactionId,
      hoursNotice
    });

    // Create refund record in database (pending status)
    const [refundRecord] = await db
      .insert(refunds)
      .values({
        bookingId,
        paymentId: payment.id,
        amount: refundAmount.toString(),
        reason,
        status: 'processing',
        cancelledAt: new Date(),
        appointmentTime: booking.appointmentDate,
        hoursNotice: hoursNotice.toString(),
        requestedBy,
      })
      .returning();

    console.log(`📝 Refund record created: ${refundRecord.id}`);

    // Process Razorpay refund
    try {
      const razorpayRefund = await refundPayment(
        payment.gatewayTransactionId,
        refundAmount
      );

      console.log(`✅ Razorpay refund successful:`, razorpayRefund);

      // Update refund record with success
      await db
        .update(refunds)
        .set({
          status: 'completed',
          razorpayRefundId: razorpayRefund.id,
          razorpayResponse: razorpayRefund,
          processedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      // Send refund confirmation SMS to client
      try {
        const [client] = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.clientId));

        if (client && client.phone) {
          await permanentSMSService.sendCancellationRefundSMS({
            clientName: `${client.firstName} ${client.lastName}`,
            clientPhone: client.phone,
            tokenNumber: booking.tokenNumber,
            appointmentDate: booking.appointmentDate.toLocaleDateString(),
            refundAmount: refundAmount.toString(),
            refundStatus: 'initiated'
          });
        }
      } catch (smsError) {
        console.error('Failed to send refund SMS:', smsError);
        // Don't fail the refund if SMS fails
      }

      return {
        success: true,
        refundId: razorpayRefund.id,
        refundAmount,
        message: `Refund of ₹${refundAmount} initiated successfully. Amount will be credited within 7 working days.`
      };

    } catch (razorpayError: any) {
      console.error('❌ Razorpay refund failed:', razorpayError);

      // Update refund record with failure
      await db
        .update(refunds)
        .set({
          status: 'failed',
          failureReason: razorpayError.message || 'Unknown error',
          processedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      return {
        success: false,
        message: `Refund failed: ${razorpayError.message}. Please contact support with booking ID: ${bookingId}`
      };
    }

  } catch (error: any) {
    console.error('❌ Refund processing error:', error);
    return {
      success: false,
      message: `Refund processing failed: ${error.message}`
    };
  }
}

/**
 * Get refund status for a booking
 */
export async function getRefundStatus(bookingId: string) {
  const refundRecords = await db
    .select()
    .from(refunds)
    .where(eq(refunds.bookingId, bookingId));

  return refundRecords;
}
