import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';

export class NotificationController {
  static async sendEmail(req: Request, res: Response) {
    const { to, subject, html, pnrNo, trainName, totalFare, passengerCount, type } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email "to" is required' });
    }

    let result;
    if (type === 'BOOKING_CONFIRMED' && pnrNo) {
      result = await EmailService.sendBookingConfirmation(to, { pnrNo, trainName: trainName || 'Express Train', totalFare: totalFare || 500, passengerCount: passengerCount || 1 });
    } else {
      result = await EmailService.sendEmail(to, subject || 'RailYatri Notification', html || '<p>Hello from RailYatri</p>');
    }

    return res.status(200).json({ success: true, result });
  }

  static async sendSMS(req: Request, res: Response) {
    const { to, message, pnrNo, trainName, type } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient phone number "to" is required' });
    }

    let result;
    if (type === 'BOOKING_CONFIRMED' && pnrNo) {
      result = await SMSService.sendBookingSMS(to, pnrNo, trainName || 'Express Train');
    } else {
      result = await SMSService.sendSMS(to, message || 'RailYatri Alert: Your booking status has updated.');
    }

    return res.status(200).json({ success: true, result });
  }

  static async getHistory(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      notifications: [
        { id: 'notif_1', type: 'EMAIL', subject: 'Booking Confirmed', sentAt: new Date().toISOString() },
        { id: 'notif_2', type: 'SMS', message: 'PNR 4829104829 Confirmed', sentAt: new Date().toISOString() },
      ],
    });
  }
}
