import { storage } from "./storage";
import { permanentSMSService } from "./sms-service";

// Generate 4-digit OTP
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create and send OTP for provider authentication
export async function sendProviderOTP(providerId: string, phone: string): Promise<{ success: boolean; message: string; otpId?: string }> {
  try {
    // Clean up any existing OTPs for this provider
    await storage.cleanupExpiredOTPs();
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour validity
    
    // Save OTP to database
    const otpRecord = await storage.createProviderOTP({
      providerId,
      phone,
      otp,
      expiresAt,
      isUsed: false,
      attempts: 0
    });
    
    // Send SMS with OTP
    const message = `Your BookMyLook provider dashboard access code is: ${otp}
    
Valid for 24 hours only.
Do not share this code with anyone.

- BookMyLook Team`;

    const smsResult = await permanentSMSService.sendSMS(
      phone,
      message,
      'provider_otp'
    );
    
    if (smsResult.success) {
      return {
        success: true,
        message: "OTP sent successfully to your registered number",
        otpId: otpRecord.id
      };
    } else {
      return {
        success: false,
        message: "Failed to send OTP. Please try again."
      };
    }
  } catch (error) {
    console.error('Error sending provider OTP:', error);
    return {
      success: false,
      message: "Error sending OTP. Please try again."
    };
  }
}

// Verify OTP for provider authentication
export async function verifyProviderOTP(providerId: string, otp: string): Promise<{ success: boolean; message: string; validFor?: string }> {
  try {
    // Find valid OTP
    const otpRecord = await storage.getValidProviderOTP(providerId, otp);
    
    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid or expired OTP. Please request a new one."
      };
    }
    
    // Mark OTP as used
    await storage.markOTPAsUsed(otpRecord.id);
    
    // Calculate remaining validity (24 hours from creation)
    const now = new Date();
    const remainingHours = Math.ceil((otpRecord.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return {
      success: true,
      message: "OTP verified successfully",
      validFor: `${remainingHours} hours`
    };
  } catch (error) {
    console.error('Error verifying provider OTP:', error);
    return {
      success: false,
      message: "Error verifying OTP. Please try again."
    };
  }
}

// Cleanup expired OTPs (run periodically)
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const cleanedCount = await storage.cleanupExpiredOTPs();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired OTPs`);
    }
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

// Schedule cleanup every hour
setInterval(cleanupExpiredOTPs, 60 * 60 * 1000); // 1 hour