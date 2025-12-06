import { notificationService } from './notifications';
import { whatsAppService } from './whatsapp-service';

type NotificationChannel = 'sms' | 'whatsapp' | 'both';

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

export class UnifiedNotificationService {
  private notificationChannel: NotificationChannel;

  constructor(channel: NotificationChannel = 'both') {
    this.notificationChannel = channel;
  }

  setChannel(channel: NotificationChannel) {
    this.notificationChannel = channel;
  }

  getChannel(): NotificationChannel {
    return this.notificationChannel;
  }

  async sendBookingConfirmationToClient(booking: BookingDetails): Promise<{ sms: boolean; whatsapp: boolean }> {
    const results = { sms: false, whatsapp: false };

    if (this.notificationChannel === 'sms' || this.notificationChannel === 'both') {
      results.sms = await notificationService.sendBookingConfirmationToClient(booking);
    }

    if (this.notificationChannel === 'whatsapp' || this.notificationChannel === 'both') {
      results.whatsapp = await whatsAppService.sendBookingConfirmationToClient(booking);
    }

    return results;
  }

  async sendNewBookingAlertToProvider(booking: BookingDetails): Promise<{ sms: boolean; whatsapp: boolean }> {
    const results = { sms: false, whatsapp: false };

    if (this.notificationChannel === 'sms' || this.notificationChannel === 'both') {
      results.sms = await notificationService.sendNewBookingAlertToProvider(booking);
    }

    if (this.notificationChannel === 'whatsapp' || this.notificationChannel === 'both') {
      results.whatsapp = await whatsAppService.sendNewBookingAlertToProvider(booking);
    }

    return results;
  }

  async sendBookingStatusUpdate(
    booking: BookingDetails, 
    status: string, 
    recipientPhone: string
  ): Promise<{ sms: boolean; whatsapp: boolean }> {
    const results = { sms: false, whatsapp: false };

    if (this.notificationChannel === 'sms' || this.notificationChannel === 'both') {
      results.sms = await notificationService.sendBookingStatusUpdate(booking, status, recipientPhone);
    }

    if (this.notificationChannel === 'whatsapp' || this.notificationChannel === 'both') {
      results.whatsapp = await whatsAppService.sendBookingStatusUpdate(booking, status, recipientPhone);
    }

    return results;
  }

  async sendAppointmentReminder(
    booking: BookingDetails, 
    recipientPhone: string, 
    isProvider: boolean
  ): Promise<{ sms: boolean; whatsapp: boolean }> {
    const results = { sms: false, whatsapp: false };

    if (this.notificationChannel === 'sms' || this.notificationChannel === 'both') {
      results.sms = await notificationService.sendAppointmentReminder(booking, recipientPhone, isProvider);
    }

    if (this.notificationChannel === 'whatsapp' || this.notificationChannel === 'both') {
      results.whatsapp = await whatsAppService.sendAppointmentReminder(booking, recipientPhone, isProvider);
    }

    return results;
  }

  async sendTestMessage(phone: string, message: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const results = { sms: false, whatsapp: false };

    if (this.notificationChannel === 'sms' || this.notificationChannel === 'both') {
      results.sms = await notificationService.sendTestSMS(phone, message);
    }

    if (this.notificationChannel === 'whatsapp' || this.notificationChannel === 'both') {
      results.whatsapp = await whatsAppService.sendTestWhatsApp(phone, message);
    }

    return results;
  }
}

export const unifiedNotificationService = new UnifiedNotificationService('sms');
