import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not found. SMS notifications will be disabled.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface BookingDetails {
  bookingId: string;
  tokenNumber: string;
  clientName: string;
  clientPhone: string;
  providerName: string;
  providerPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPrice: string;
  providerLocation: string;
}

interface NotificationService {
  sendBookingConfirmationToClient(booking: BookingDetails): Promise<boolean>;
  sendNewBookingAlertToProvider(booking: BookingDetails): Promise<boolean>;
  sendBookingStatusUpdate(booking: BookingDetails, status: string, recipientPhone: string): Promise<boolean>;
  sendAppointmentReminder(booking: BookingDetails, recipientPhone: string, isProvider: boolean): Promise<boolean>;
  sendTestSMS(phone: string, message: string): Promise<boolean>;
}

export class SMSNotificationService implements NotificationService {
  private async sendSMS(to: string, message: string): Promise<boolean> {
    if (!client || !twilioPhoneNumber) {
      console.log('SMS notification would be sent to', to, ':', message);
      return false;
    }

    try {
      // Ensure phone number is in international format
      const formattedPhone = to.startsWith('+') ? to : `+91${to}`;
      
      // Use phone number for now (alphanumeric requires registration in India)
      const senderConfig = { from: twilioPhoneNumber };

      await client.messages.create({
        body: message,
        ...senderConfig,
        to: formattedPhone,
      });
      
      console.log(`SMS sent successfully to ${formattedPhone}, From: ${twilioPhoneNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  async sendBookingConfirmationToClient(booking: BookingDetails): Promise<boolean> {
    const message = `🎉 Booking Confirmed!

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Provider: ${booking.providerName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
Price: ₹${booking.totalPrice}
Location: ${booking.providerLocation}

Show this token at the salon. 

- BookMyLook Team`;

    return this.sendSMS(booking.clientPhone, message);
  }

  async sendNewBookingAlertToProvider(booking: BookingDetails): Promise<boolean> {
    const message = `📅 New Booking Alert!

Token: ${booking.tokenNumber}
Client: ${booking.clientName}
Phone: ${booking.clientPhone}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
Amount: ₹${booking.totalPrice}

Please confirm availability.

- BookMyLook Team`;

    return this.sendSMS(booking.providerPhone, message);
  }

  async sendBookingStatusUpdate(booking: BookingDetails, status: string, recipientPhone: string): Promise<boolean> {
    let statusMessage = '';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        statusMessage = '✅ Your booking has been confirmed by the provider.';
        break;
      case 'cancelled':
        statusMessage = '❌ Your booking has been cancelled.';
        break;
      case 'completed':
        statusMessage = '🎉 Your service has been completed. Thank you for choosing us!';
        break;
      case 'rescheduled':
        statusMessage = '📅 Your booking has been rescheduled.';
        break;
      default:
        statusMessage = `📋 Booking status updated: ${status}`;
    }

    const message = `${statusMessage}

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}

BookMyLook`;

    return this.sendSMS(recipientPhone, message);
  }

  async sendAppointmentReminder(booking: BookingDetails, recipientPhone: string, isProvider: boolean): Promise<boolean> {
    const role = isProvider ? 'Provider' : 'Client';
    const reminderText = isProvider 
      ? `Upcoming appointment with ${booking.clientName}`
      : `Your appointment at ${booking.providerName}`;

    const message = `⏰ Reminder: ${reminderText}

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
${isProvider ? `Client: ${booking.clientName} (${booking.clientPhone})` : `Location: ${booking.providerLocation}`}

BookMyLook`;

    return this.sendSMS(recipientPhone, message);
  }

  async sendTestSMS(phone: string, message: string): Promise<boolean> {
    const testMessage = `🧪 TEST SMS from BookMyLook

${message}

This is a test message to verify SMS functionality.`;

    return this.sendSMS(phone, testMessage);
  }
}

// Export singleton instance
export const notificationService = new SMSNotificationService();

// Helper function to format date for display
export function formatDateForNotification(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to format time for display
export function formatTimeForNotification(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}