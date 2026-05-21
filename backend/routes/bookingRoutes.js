import express from 'express';
import {
  createBooking,
  getRestaurantBookings,
  updateBookingStatus,
  getUserBookings
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer creates a booking
router.post('/', protect, createBooking);

// Customer fetches their own bookings
router.get('/mine', protect, getUserBookings);

// Restaurant fetches their bookings
router.get('/restaurant', protect, authorize('restaurant'), getRestaurantBookings);

// Restaurant updates booking status
router.patch('/:id/status', protect, authorize('restaurant'), updateBookingStatus);

export default router;
