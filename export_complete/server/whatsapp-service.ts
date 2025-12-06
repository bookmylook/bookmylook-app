import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  console.warn('⚠️ Twilio WhatsApp credentials not found. WhatsApp notifications will be disabled.');
} else {
  console.log('✅ WhatsApp notifications enabled');
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

export class WhatsAppNotificationService {
  private async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!client || !twilioWhatsAppNumber) {
      console.log('WhatsApp notification would be sent to', to, ':', message);
      return false;
    }

    try {
      const formattedPhone = to.startsWith('+') ? to : `+91${to}`;
      const fromNumber = twilioWhatsAppNumber.startsWith('whatsapp:') 
        ? twilioWhatsAppNumber 
        : `whatsapp:${twilioWhatsAppNumber}`;
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:${formattedPhone}`,
      });
      
      console.log(`WhatsApp sent successfully to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return false;
    }
  }

  async sendBookingConfirmationToClient(booking: BookingDetails): Promise<boolean> {
    const message = `🎉 *Booking Confirmed!*

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Provider:* ${booking.providerName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
*Price:* ₹${booking.totalPrice}
*Location:* ${booking.providerLocation}

Show this token at the salon.

_- BookMyLook Team_`;

    return this.sendWhatsApp(booking.clientPhone, message);
  }

  async sendNewBookingAlertToProvider(booking: BookingDetails): Promise<boolean> {
    const message = `📅 *New Booking Alert!*

*Token:* ${booking.tokenNumber}
*Client:* ${booking.clientName}
*Phone:* ${booking.clientPhone}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
*Amount:* ₹${booking.totalPrice}

Please confirm availability.

_- BookMyLook Team_`;

    return this.sendWhatsApp(booking.providerPhone, message);
  }

  async sendBookingStatusUpdate(booking: BookingDetails, status: string, recipientPhone: string): Promise<boolean> {
    let statusMessage = '';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        statusMessage = '✅ Your booking has been *confirmed* by the provider.';
        break;
      case 'cancelled':
        statusMessage = '❌ Your booking has been *cancelled*.';
        break;
      case 'completed':
        statusMessage = '🎉 Your service has been *completed*. Thank you for choosing us!';
        break;
      case 'rescheduled':
        statusMessage = '📅 Your booking has been *rescheduled*.';
        break;
      default:
        statusMessage = `📋 Booking status updated: *${status}*`;
    }

    const message = `${statusMessage}

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}

_BookMyLook_`;

    return this.sendWhatsApp(recipientPhone, message);
  }

  async sendAppointmentReminder(booking: BookingDetails, recipientPhone: string, isProvider: boolean): Promise<boolean> {
    const reminderText = isProvider 
      ? `Upcoming appointment with *${booking.clientName}*`
      : `Your appointment at *${booking.providerName}*`;

    const message = `⏰ *Reminder:* ${reminderText}

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
${isProvider ? `*Client:* ${booking.clientName} (${booking.clientPhone})` : `*Location:* ${booking.providerLocation}`}

_BookMyLook_`;

    return this.sendWhatsApp(recipientPhone, message);
  }

  async sendTestWhatsApp(phone: string, message: string): Promise<boolean> {
    const testMessage = `🧪 *TEST WhatsApp from BookMyLook*

${message}

This is a test message to verify WhatsApp functionality.`;

    return this.sendWhatsApp(phone, testMessage);
  }
}

export const whatsAppService = new WhatsAppNotificationService();
