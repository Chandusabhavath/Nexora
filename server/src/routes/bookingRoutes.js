import express from 'express';
import { createBooking, getBookings, getBookingById, updateBookingStatus, reportPayment, confirmPayment } from '../controllers/bookingController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyAuth, createBooking);
router.get('/', verifyAuth, getBookings);
router.get('/:id', verifyAuth, getBookingById);
router.patch('/:id/status', verifyAuth, updateBookingStatus);
router.post('/:id/report-payment', verifyAuth, reportPayment);
router.post('/:id/confirm-payment', verifyAuth, confirmPayment);

export default router;
