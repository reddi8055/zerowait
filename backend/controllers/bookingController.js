import Booking from '../models/Booking.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';

export const createBooking = async (req, res) => {
  try {
    const { restaurantId, tableIds, items, customerName, numberOfPeople, totalAmount, advanceAmount } = req.body;

    if (!restaurantId || !tableIds || !tableIds.length || !customerName || !numberOfPeople || !totalAmount || !advanceAmount) {
      return res.status(400).json({ error: 'Please provide all required booking details' });
    }

    // Ensure all tables are still available
    const tables = await Table.find({ _id: { $in: tableIds } });
    if (tables.length !== tableIds.length) {
      return res.status(400).json({ error: 'One or more tables could not be found' });
    }
    const unavailableTables = tables.filter(t => !t.isAvailable);
    if (unavailableTables.length > 0) {
      return res.status(400).json({ error: 'One or more selected tables are no longer available' });
    }

    // Create the booking
    const booking = await Booking.create({
      userId: req.user.id,
      restaurantId,
      tableIds,
      customerName,
      numberOfPeople,
      totalAmount,
      advanceAmount,
      items: items || [],
      status: 'confirmed',
    });

    // Mark all tables as unavailable
    await Table.updateMany({ _id: { $in: tableIds } }, { $set: { isAvailable: false } });

    // Increment restaurant's wait time by 10 minutes
    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant) {
      restaurant.currentWaitTime = (restaurant.currentWaitTime || 0) + 10;
      await restaurant.save();
    }

    res.status(201).json({ message: 'Booking confirmed successfully', booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getRestaurantBookings = async (req, res) => {
  try {
    // Find the restaurant owned by the logged-in user
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get all bookings for this restaurant, populate table details
    const bookings = await Booking.find({ restaurantId: restaurant._id })
      .populate('tableIds', 'tableName seats')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching restaurant bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = ['confirmed', 'preparing', 'ready', 'served', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the restaurant owned by the logged-in user to ensure they own the booking
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const booking = await Booking.findOneAndUpdate(
      { _id: id, restaurantId: restaurant._id },
      { status },
      { new: true }
    ).populate('tableIds', 'tableName seats');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If order is served or cancelled, free up the tables
    if (status === 'served' || status === 'cancelled') {
      if (booking.tableIds && booking.tableIds.length > 0) {
        const tIds = booking.tableIds.map(t => t._id);
        await Table.updateMany({ _id: { $in: tIds } }, { $set: { isAvailable: true } });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// @desc    Get user's own bookings
// @route   GET /api/bookings/mine
// @access  Private (User)
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
