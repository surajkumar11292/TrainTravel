import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router: Router = Router();

router.post('/', BookingController.createBooking);
router.get('/', BookingController.getUserBookings);
router.get('/pnr/:pnrNo', BookingController.getBookingByPNR);
router.get('/:id', BookingController.getBooking);
router.post('/:id/cancel', BookingController.cancelBooking);

export default router;
