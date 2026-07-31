import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '@traintravel/logger';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export class EmailService {
  static async sendBookingConfirmation(toEmail: string, data: { pnrNo: string; trainName: string; totalFare: number; passengerCount: number }) {
    const subject = `🎫 Booking Confirmed! PNR: ${data.pnrNo} - RailYatri`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background: #1e3a8a; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚆 RailYatri Ticket Confirmation</h1>
          </div>
          <div style="padding: 24px; color: #333333;">
            <h2 style="color: #1e3a8a;">Your Ticket is Confirmed!</h2>
            <p>Thank you for booking with RailYatri. Here are your booking details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px; font-weight: bold;">PNR Number:</td>
                <td style="padding: 10px; color: #16a34a; font-weight: bold; font-size: 18px;">${data.pnrNo}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px; font-weight: bold;">Train:</td>
                <td style="padding: 10px;">${data.trainName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px; font-weight: bold;">Passengers:</td>
                <td style="padding: 10px;">${data.passengerCount}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px; font-weight: bold;">Total Fare Paid:</td>
                <td style="padding: 10px; font-weight: bold;">₹${data.totalFare}</td>
              </tr>
            </table>
            <p style="margin-top: 24px; font-size: 12px; color: #777777;">Have a safe and comfortable journey!</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(toEmail, subject, html);
  }

  static async sendCancellationConfirmation(toEmail: string, data: { pnrNo: string; refundAmount: number }) {
    const subject = `❌ Booking Cancelled - PNR: ${data.pnrNo} - RailYatri`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Ticket Cancellation Notice</h2>
        <p>Your booking for PNR <strong>${data.pnrNo}</strong> has been cancelled.</p>
        <p>Refund Amount of <strong>₹${data.refundAmount}</strong> has been initiated and will reflect in 3-5 business days.</p>
      </div>
    `;

    return this.sendEmail(toEmail, subject, html);
  }

  static async sendEmail(to: string, subject: string, html: string) {
    if (!resend || !config.resendApiKey || config.resendApiKey === 're_123456789') {
      logger.info(`[Email Service (Mock)] Sending email to: ${to} | Subject: ${subject}`);
      return { id: `mock_email_${Date.now()}`, success: true };
    }

    try {
      const response = await resend.emails.send({
        from: config.emailFrom,
        to: [to],
        subject,
        html,
      });
      logger.info(`Email successfully sent to ${to}: ${response.data?.id}`);
      return { id: response.data?.id, success: true };
    } catch (err: any) {
      logger.error(`Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}
