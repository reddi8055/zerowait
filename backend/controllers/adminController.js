import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

export const getStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeUsers = await User.countDocuments();
    
    // Count bookings for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const bookingsToday = await Booking.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    res.json({
      totalRestaurants,
      activeUsers,
      bookingsToday
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
