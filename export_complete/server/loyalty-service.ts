import { db } from "./db";
import { users, pointsTransactions, offers, offerRedemptions } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export class LoyaltyService {
  // Generate unique referral code
  static generateReferralCode(firstName: string, phone: string): string {
    const namePrefix = firstName.slice(0, 3).toUpperCase();
    const phoneDigits = phone.slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${namePrefix}${phoneDigits}${random}`;
  }

  // Award points for booking completion (10 points per booking)
  static async awardBookingPoints(userId: string, bookingId: string, bookingAmount: number): Promise<void> {
    const POINTS_PER_BOOKING = 10;
    
    // Get current balance
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return;

    const currentBalance = user[0].loyaltyPoints || 0;
    const newBalance = currentBalance + POINTS_PER_BOOKING;

    // Update user balance
    await db.update(users)
      .set({ loyaltyPoints: newBalance })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(pointsTransactions).values({
      userId,
      points: POINTS_PER_BOOKING,
      type: "earned_booking",
      description: `Earned ${POINTS_PER_BOOKING} points from booking`,
      bookingId,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    });
  }

  // Award referral bonus (50 points for both referrer and referred)
  static async awardReferralBonus(referrerId: string, newUserId: string): Promise<void> {
    const REFERRAL_POINTS = 50;

    // Award points to referrer
    const referrer = await db.select().from(users).where(eq(users.id, referrerId)).limit(1);
    if (referrer.length) {
      const currentBalance = referrer[0].loyaltyPoints || 0;
      const newBalance = currentBalance + REFERRAL_POINTS;

      await db.update(users)
        .set({ loyaltyPoints: newBalance })
        .where(eq(users.id, referrerId));

      await db.insert(pointsTransactions).values({
        userId: referrerId,
        points: REFERRAL_POINTS,
        type: "earned_referral",
        description: `Earned ${REFERRAL_POINTS} points for referring a friend`,
        referralUserId: newUserId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      });
    }

    // Award points to new user
    const newUser = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
    if (newUser.length) {
      const currentBalance = newUser[0].loyaltyPoints || 0;
      const newBalance = currentBalance + REFERRAL_POINTS;

      await db.update(users)
        .set({ loyaltyPoints: newBalance })
        .where(eq(users.id, newUserId));

      await db.insert(pointsTransactions).values({
        userId: newUserId,
        points: REFERRAL_POINTS,
        type: "earned_referral",
        description: `Welcome bonus! Earned ${REFERRAL_POINTS} points for joining via referral`,
        referralUserId: referrerId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      });
    }
  }

  // Redeem points for discount (100 points = ₹100 discount)
  static async redeemPoints(userId: string, pointsToRedeem: number, bookingId: string): Promise<number> {
    const POINTS_TO_RUPEES = 1; // 1 point = ₹1
    
    // Get current balance
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");

    const currentBalance = user[0].loyaltyPoints || 0;
    if (currentBalance < pointsToRedeem) {
      throw new Error("Insufficient points balance");
    }

    const discountAmount = pointsToRedeem * POINTS_TO_RUPEES;
    const newBalance = currentBalance - pointsToRedeem;

    // Update user balance
    await db.update(users)
      .set({ loyaltyPoints: newBalance })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(pointsTransactions).values({
      userId,
      points: -pointsToRedeem,
      type: "spent_discount",
      description: `Redeemed ${pointsToRedeem} points for ₹${discountAmount} discount`,
      bookingId,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    });

    return discountAmount;
  }

  // Get active offers for user
  static async getActiveOffers(userId?: string) {
    const now = new Date();
    
    const activeOffers = await db.select()
      .from(offers)
      .where(
        and(
          eq(offers.isActive, true),
          lte(offers.validFrom, now),
          gte(offers.validUntil, now)
        )
      );

    // Filter by user eligibility if userId provided
    if (userId) {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length) {
        const userBookingsCount = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.id, userId))
          .execute();
        
        const isNewUser = (userBookingsCount[0]?.count || 0) === 0;
        
        return activeOffers.filter(offer => {
          if (offer.targetUserType === "new_users" && !isNewUser) return false;
          if (offer.maxRedemptions && (offer.currentRedemptions || 0) >= offer.maxRedemptions) return false;
          return true;
        });
      }
    }

    return activeOffers;
  }

  // Calculate discount from offer
  static calculateOfferDiscount(offer: any, bookingAmount: number): number {
    if (offer.discountType === "percentage") {
      let discount = (bookingAmount * parseFloat(offer.discountValue)) / 100;
      if (offer.maxDiscount) {
        discount = Math.min(discount, parseFloat(offer.maxDiscount));
      }
      return Math.round(discount);
    } else if (offer.discountType === "fixed_amount") {
      return parseFloat(offer.discountValue);
    } else if (offer.discountType === "points_multiplier") {
      // Points multiplier doesn't give direct discount
      return 0;
    }
    return 0;
  }

  // Apply offer to booking
  static async applyOffer(userId: string, offerId: string, bookingId: string, bookingAmount: number): Promise<number> {
    // Verify offer is still valid
    const offer = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
    if (!offer.length) throw new Error("Offer not found");

    const offerData = offer[0];
    const now = new Date();

    if (!offerData.isActive) throw new Error("Offer is not active");
    if (offerData.validFrom > now || offerData.validUntil < now) {
      throw new Error("Offer is not valid at this time");
    }
    if (offerData.maxRedemptions && (offerData.currentRedemptions || 0) >= offerData.maxRedemptions) {
      throw new Error("Offer redemption limit reached");
    }
    if (offerData.minBookingAmount && bookingAmount < parseFloat(offerData.minBookingAmount)) {
      throw new Error(`Minimum booking amount of ₹${offerData.minBookingAmount} required`);
    }

    // Calculate discount
    const discountAmount = this.calculateOfferDiscount(offerData, bookingAmount);

    // Record redemption
    await db.insert(offerRedemptions).values({
      userId,
      offerId,
      bookingId,
      discountAmount: discountAmount.toString(),
    });

    // Update offer redemption count
    await db.update(offers)
      .set({ currentRedemptions: (offerData.currentRedemptions || 0) + 1 })
      .where(eq(offers.id, offerId));

    return discountAmount;
  }

  // Get user's points balance and transaction history
  static async getUserLoyaltyData(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");

    const transactions = await db.select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(sql`${pointsTransactions.createdAt} DESC`)
      .limit(50);

    return {
      balance: user[0].loyaltyPoints || 0,
      referralCode: user[0].referralCode,
      transactions,
    };
  }
}
