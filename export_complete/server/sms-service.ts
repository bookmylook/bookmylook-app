import twilio from 'twilio';
import { db } from './db';
import { smsLogs, smsTemplates, scheduledSms, smsCampaigns } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface MessageData {
  recipientPhone: string;
  recipientName?: string;
  message: string;
  messageType: string;
  bookingId?: string;
  providerId?: string;
  clientId?: string;
}

interface TemplateVariable {
  [key: string]: string | number;
}

interface CancellationSMSData {
  clientName: string;
  clientPhone: string;
  tokenNumber: number;
  appointmentDate: string;
  refundAmount: string;
  refundStatus: 'initiated' | 'completed' | 'failed';
}

export class PermanentSMSService {
  
  /**
   * Send SMS with permanent logging
   */
  async sendSMS(data: MessageData): Promise<{ success: boolean; logId?: string; error?: string }> {
    const formattedPhone = data.recipientPhone.startsWith('+') ? data.recipientPhone : `+91${data.recipientPhone}`;
    
    // Create SMS log entry immediately
    const [logEntry] = await db.insert(smsLogs).values({
      recipientPhone: data.recipientPhone,
      recipientName: data.recipientName,
      message: data.message,
      messageType: data.messageType,
      status: 'pending',
      bookingId: data.bookingId,
      providerId: data.providerId,
      clientId: data.clientId,
      createdAt: new Date(),
    }).returning();

    try {
      if (!client || !twilioPhoneNumber) {
        // Update log with failure
        await db.update(smsLogs)
          .set({ 
            status: 'failed', 
            errorMessage: 'Twilio client not configured',
            sentAt: new Date()
          })
          .where(eq(smsLogs.id, logEntry.id));
        
        console.log('SMS would be sent to', formattedPhone, ':', data.message);
        return { success: false, logId: logEntry.id, error: 'Twilio not configured' };
      }

      // Send SMS via Twilio - use phone number for now (alphanumeric requires registration in India)
      const senderConfig = { from: twilioPhoneNumber };

      const twilioResponse = await client.messages.create({
        body: data.message,
        ...senderConfig,
        to: formattedPhone,
      });

      // Update log with success
      await db.update(smsLogs)
        .set({ 
          status: 'sent',
          twilioMessageSid: twilioResponse.sid,
          cost: twilioResponse.price || '0',
          sentAt: new Date()
        })
        .where(eq(smsLogs.id, logEntry.id));

      console.log(`SMS sent successfully to ${formattedPhone}, SID: ${twilioResponse.sid}, From: ${twilioPhoneNumber}`);
      return { success: true, logId: logEntry.id };

    } catch (error: any) {
      // Update log with failure
      await db.update(smsLogs)
        .set({ 
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          sentAt: new Date()
        })
        .where(eq(smsLogs.id, logEntry.id));

      console.error('Error sending SMS:', error);
      return { success: false, logId: logEntry.id, error: error.message };
    }
  }

  /**
   * Create SMS template
   */
  async createTemplate(
    name: string, 
    template: string, 
    messageType: string, 
    description?: string,
    variables: string[] = [],
    createdBy?: string
  ): Promise<any> {
    const [templateEntry] = await db.insert(smsTemplates).values({
      name,
      description,
      messageType,
      template,
      variables,
      createdBy,
    }).returning();

    return templateEntry;
  }

  /**
   * Get all active templates
   */
  async getTemplates(): Promise<any[]> {
    return await db.select().from(smsTemplates).where(eq(smsTemplates.isActive, true));
  }

  /**
   * Send SMS using template
   */
  async sendFromTemplate(
    templateId: string, 
    recipientPhone: string, 
    variables: TemplateVariable,
    recipientName?: string,
    bookingId?: string,
    providerId?: string,
    clientId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, templateId));
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Replace variables in template
    let message = template.template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Update template usage count
    await db.update(smsTemplates)
      .set({ usageCount: (template.usageCount || 0) + 1 })
      .where(eq(smsTemplates.id, templateId));

    return await this.sendSMS({
      recipientPhone,
      recipientName,
      message,
      messageType: template.messageType,
      bookingId,
      providerId,
      clientId,
    });
  }

  /**
   * Schedule SMS for future sending
   */
  async scheduleSSM(
    recipientPhone: string,
    message: string,
    scheduledFor: Date,
    messageType: string = 'scheduled',
    recipientName?: string,
    templateId?: string,
    bookingId?: string,
    providerId?: string,
    clientId?: string,
    maxAttempts: number = 3
  ): Promise<any> {
    const [scheduledEntry] = await db.insert(scheduledSms).values({
      recipientPhone,
      recipientName,
      message,
      templateId,
      messageType,
      scheduledFor,
      bookingId,
      providerId,
      clientId,
      maxAttempts,
    }).returning();

    return scheduledEntry;
  }

  /**
   * Process pending scheduled SMS
   */
  async processScheduledSMS(): Promise<void> {
    const now = new Date();
    
    // Get all pending scheduled SMS that are due
    const pendingSMS = await db.select()
      .from(scheduledSms)
      .where(
        and(
          eq(scheduledSms.status, 'pending'),
          lt(scheduledSms.scheduledFor, now)
        )
      );

    for (const sms of pendingSMS) {
      try {
        const result = await this.sendSMS({
          recipientPhone: sms.recipientPhone,
          recipientName: sms.recipientName || undefined,
          message: sms.message,
          messageType: sms.messageType,
          bookingId: sms.bookingId || undefined,
          providerId: sms.providerId || undefined,
          clientId: sms.clientId || undefined,
        });

        // Update scheduled SMS status
        await db.update(scheduledSms)
          .set({
            status: result.success ? 'sent' : 'failed',
            attempts: (sms.attempts || 0) + 1,
            errorMessage: result.error,
            sentAt: new Date(),
          })
          .where(eq(scheduledSms.id, sms.id));

      } catch (error: any) {
        // Handle retry logic
        const newAttempts = (sms.attempts || 0) + 1;
        if (newAttempts < (sms.maxAttempts || 3)) {
          // Schedule retry for later (e.g., 5 minutes)
          await db.update(scheduledSms)
            .set({
              attempts: newAttempts,
              errorMessage: error.message,
              scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
            })
            .where(eq(scheduledSms.id, sms.id));
        } else {
          // Mark as failed after max attempts
          await db.update(scheduledSms)
            .set({
              status: 'failed',
              attempts: newAttempts,
              errorMessage: error.message,
            })
            .where(eq(scheduledSms.id, sms.id));
        }
      }
    }
  }

  /**
   * Get SMS logs with filtering
   */
  async getSMSLogs(
    limit: number = 50,
    offset: number = 0,
    messageType?: string,
    status?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<any[]> {
    const conditions = [];
    if (messageType) conditions.push(eq(smsLogs.messageType, messageType));
    if (status) conditions.push(eq(smsLogs.status, status));
    if (fromDate) conditions.push(gte(smsLogs.createdAt, fromDate));
    if (toDate) conditions.push(lt(smsLogs.createdAt, toDate));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(smsLogs)
        .where(and(...conditions))
        .orderBy(smsLogs.createdAt)
        .limit(limit)
        .offset(offset);
    }

    return await db
      .select()
      .from(smsLogs)
      .orderBy(smsLogs.createdAt)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    totalCost: number;
    messageTypeBreakdown: any[];
    recentActivity: any[];
  }> {
    // This would be better implemented with aggregate functions
    // For now, getting all logs and calculating in memory
    const allLogs = await db.select().from(smsLogs);
    
    const totalSent = allLogs.filter(log => log.status === 'sent').length;
    const totalFailed = allLogs.filter(log => log.status === 'failed').length;
    const totalCost = allLogs
      .filter(log => log.cost)
      .reduce((sum, log) => sum + parseFloat(String(log.cost)), 0);

    // Group by message type
    const messageTypeBreakdown = allLogs.reduce((acc: any, log) => {
      if (!acc[log.messageType]) {
        acc[log.messageType] = { type: log.messageType, count: 0, sent: 0, failed: 0 };
      }
      acc[log.messageType].count++;
      if (log.status === 'sent') acc[log.messageType].sent++;
      if (log.status === 'failed') acc[log.messageType].failed++;
      return acc;
    }, {});

    const recentActivity = allLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalSent,
      totalFailed,
      totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
      messageTypeBreakdown: Object.values(messageTypeBreakdown),
      recentActivity,
    };
  }

  /**
   * Send bulk SMS campaign
   */
  async sendBulkSMS(
    recipients: { phone: string; name?: string; variables?: TemplateVariable }[],
    templateId: string,
    campaignName: string,
    description?: string,
    createdBy?: string
  ): Promise<{ campaignId: string; results: any[] }> {
    // Create campaign entry
    const [campaign] = await db.insert(smsCampaigns).values({
      name: campaignName,
      description: description || '',
      templateId,
      targetAudience: 'specific_list',
      recipientList: recipients.map(r => ({ phone: r.phone, name: r.name })),
      totalRecipients: recipients.length,
      status: 'sending',
      createdBy: createdBy || 'system',
    }).returning();

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        const result = await this.sendFromTemplate(
          templateId,
          recipient.phone,
          recipient.variables || {},
          recipient.name
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }

        results.push({
          phone: recipient.phone,
          success: result.success,
          error: result.error,
          logId: result.logId,
        });
      } catch (error: any) {
        failedCount++;
        results.push({
          phone: recipient.phone,
          success: false,
          error: error.message,
        });
      }
    }

    // Update campaign with results
    await db.update(smsCampaigns)
      .set({
        status: 'completed',
        sentCount,
        failedCount,
      })
      .where(eq(smsCampaigns.id, campaign.id));

    return { campaignId: campaign.id, results };
  }

  /**
   * Send booking cancellation & refund notification SMS
   */
  async sendCancellationRefundSMS(data: CancellationSMSData): Promise<{ success: boolean; logId?: string; error?: string }> {
    const refundStatusText = data.refundStatus === 'initiated' 
      ? 'initiated and will be credited within 7 working days'
      : data.refundStatus === 'completed'
      ? 'completed'
      : 'failed - please contact support';

    const message = `Dear ${data.clientName}, your booking (Token #${data.tokenNumber}) for ${data.appointmentDate} has been cancelled. Your refund of ₹${data.refundAmount} has been ${refundStatusText}. - BookMyLook`;

    return await this.sendSMS({
      recipientPhone: data.clientPhone,
      recipientName: data.clientName,
      message,
      messageType: 'booking_cancellation_refund'
    });
  }
}

// Export singleton instance
export const permanentSMSService = new PermanentSMSService();

// Helper function to start scheduled SMS processor
export function startScheduledSMSProcessor() {
  // Process scheduled SMS every minute
  setInterval(async () => {
    try {
      await permanentSMSService.processScheduledSMS();
    } catch (error) {
      console.error('Error processing scheduled SMS:', error);
    }
  }, 60 * 1000); // Every minute

  console.log('Scheduled SMS processor started');
}