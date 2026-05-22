import Booking from '../models/Booking.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import {
  calculateWaitingTime,
  sendConfirmationEmail,
  sendConfirmationWhatsApp,
} from '../utils/notifications.js';

// ─────────────────────────────────────────────────────────────
// @desc    Customer creates a booking
// @route   POST /api/bookings
// @access  Private (User)
// ─────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      restaurantId,
      tableIds,
      items,
      customerName,
      customerEmail,
      customerPhone,
      city,
      bookingTime,
      numberOfPeople,
      totalAmount,
      advanceAmount,
    } = req.body;

    // ── Core field validation ─────────────────────────────────
    if (!restaurantId || !tableIds?.length || !customerName || !numberOfPeople || !totalAmount || !advanceAmount) {
      return res.status(400).json({ error: 'Please provide all required booking details.' });
    }

    // Email format check
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Phone: accept 10-digit Indian OR full E.164 format
    if (customerPhone) {
      const digits = customerPhone.replace(/\D/g, '');
      const isValid10  = /^[6-9]\d{9}$/.test(digits);           // 10-digit Indian
      const isValid12  = /^91[6-9]\d{9}$/.test(digits);         // 91XXXXXXXXXX
      const isValidE164 = /^\+?[1-9]\d{6,14}$/.test(customerPhone.replace(/\s/g, '')); // any E.164
      if (!isValid10 && !isValid12 && !isValidE164) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number (or include country code, e.g. +91XXXXXXXXXX).' });
      }
    }

    // ── Table availability check ──────────────────────────────
    const tables = await Table.find({ _id: { $in: tableIds } });
    if (tables.length !== tableIds.length) {
      return res.status(400).json({ error: 'One or more tables could not be found.' });
    }
    const unavailable = tables.filter(t => !t.isAvailable);
    if (unavailable.length > 0) {
      return res.status(400).json({ error: 'One or more selected tables are no longer available.' });
    }

    // ── Calculate dynamic wait time ───────────────────────────
    const effectiveBookingTime = bookingTime || new Date().toISOString();
    const waitingTimeStatus    = calculateWaitingTime(effectiveBookingTime);

    // ── Save booking to DB ────────────────────────────────────
    const booking = await Booking.create({
      userId:           req.user.id,
      restaurantId,
      tableIds,
      customerName:     customerName.trim(),
      customerEmail:    customerEmail?.trim()  || '',
      customerPhone:    customerPhone?.trim()  || '',
      city:             city?.trim()           || '',
      bookingTime:      effectiveBookingTime,
      waitingTimeStatus,
      numberOfPeople,
      totalAmount,
      advanceAmount,
      items:            items || [],
      status:           'confirmed',
    });

    // ── Mark tables as unavailable ────────────────────────────
    await Table.updateMany({ _id: { $in: tableIds } }, { $set: { isAvailable: false } });

    // ── Increment restaurant wait time by 10 min ──────────────
    const restaurant     = await Restaurant.findById(restaurantId);
    const restaurantName = restaurant?.name || 'the restaurant';
    if (restaurant) {
      restaurant.currentWaitTime = (restaurant.currentWaitTime || 0) + 10;
      await restaurant.save();
    }

    // ── Send notifications (non-blocking, isolated try-catch) ─
    const notifyPayload = {
      customerName:     customerName.trim(),
      restaurantName,
      ownerEmail:       restaurant?.ownerEmail || '',
      ownerPhone:       restaurant?.ownerPhone || '',
      city:             city?.trim() || '',
      bookingTime:      effectiveBookingTime,
      waitingTimeStatus,
      bookingId:        booking._id.toString(),
    };

    // Email notification
    if (customerEmail) {
      sendConfirmationEmail({ ...notifyPayload, customerEmail })
        .catch(err => console.error('[Booking] Email notification error:', err.message));
    }

    // WhatsApp notification
    if (customerPhone) {
      sendConfirmationWhatsApp({ ...notifyPayload, customerPhone })
        .catch(err => console.error('[Booking] WhatsApp notification error:', err.message));
    }

    // ── Respond to client immediately ─────────────────────────
    return res.status(201).json({
      message:           'Booking confirmed successfully',
      booking,
      bookingId:         booking._id.toString(),
      waitingTimeStatus,
    });

  } catch (error) {
    console.error('[Booking] ❌ createBooking error:', error);
    return res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Restaurant fetches their bookings
// @route   GET /api/bookings/restaurant
// @access  Private (Restaurant Owner)
// ─────────────────────────────────────────────────────────────
export const getRestaurantBookings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const bookings = await Booking.find({ restaurantId: restaurant._id })
      .populate('tableIds', 'tableName seats')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('[Booking] getRestaurantBookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Restaurant updates booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private (Restaurant Owner)
// ─────────────────────────────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id }     = req.params;

    const allowed = ['confirmed', 'preparing', 'ready', 'served', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const booking = await Booking.findOneAndUpdate(
      { _id: id, restaurantId: restaurant._id },
      { status },
      { new: true }
    ).populate('tableIds', 'tableName seats');

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (status === 'served' || status === 'cancelled') {
      const tIds = booking.tableIds?.map(t => t._id) || [];
      if (tIds.length) await Table.updateMany({ _id: { $in: tIds } }, { $set: { isAvailable: true } });
    }

    res.json(booking);
  } catch (error) {
    console.error('[Booking] updateBookingStatus error:', error);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get user's own bookings
// @route   GET /api/bookings/mine
// @access  Private (User)
// ─────────────────────────────────────────────────────────────
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('restaurantId', 'name imageUrl cuisineType')
      .populate('tableIds', 'tableName seats')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
