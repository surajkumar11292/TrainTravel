import twilio from 'twilio';
import { config } from '../config';
import { logger } from '@traintravel/logger';

const twilioClient =
  config.twilioAccountSid && config.twilioAccountSid.startsWith('AC')
    ? twilio(config.twilioAccountSid, config.twilioAuthToken)
    : null;

export class SMSService {
  static async sendBookingSMS(toPhone: string, pnrNo: string, trainName: string) {
    const body = `RailYatri: Booking Confirmed! PNR: ${pnrNo} for ${trainName}. Have a safe journey!`;
    return this.sendSMS(toPhone, body);
  }

  static async sendWaitlistPromotedSMS(toPhone: string, pnrNo: string) {
    const body = `RailYatri: Great news! Your waitlisted ticket (PNR: ${pnrNo}) is now CONFIRMED!`;
    return this.sendSMS(toPhone, body);
  }

  static async sendOTP(toPhone: string, otp: string) {
    const body = `RailYatri: Your verification OTP is ${otp}. Valid for 10 minutes. Do not share.`;
    return this.sendSMS(toPhone, body);
  }

  static async sendSMS(to: string, message: string) {
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;

    if (!twilioClient || !config.twilioPhoneNumber) {
      logger.info(`[SMS Service (Mock)] To: ${formattedTo} | Message: ${message}`);
      return { sid: `mock_sms_${Date.now()}`, success: true };
    }

    try {
      const res = await twilioClient.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to: formattedTo,
      });
      logger.info(`SMS sent successfully to ${formattedTo}: ${res.sid}`);
      return { sid: res.sid, success: true };
    } catch (err: any) {
      logger.error(`Failed to send SMS to ${formattedTo}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}
