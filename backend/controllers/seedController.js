import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Booking from '../models/Booking.js';
import MenuItem from '../models/MenuItem.js';
import { hashPassword } from '../utils/auth.js';

export const seedDatabase = async (req, res) => {
  try {
    // 1. DELETE EVERYTHING (Wipe the database clean)
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Table.deleteMany({});
    await Booking.deleteMany({});
    await MenuItem.deleteMany({});

    // 2. CREATE ONLY THE ADMIN ACCOUNT
    const adminPassword = await hashPassword('admin123');
    await User.create({
      name: 'Super Admin',
      email: 'admin@zerowait.com',
      password: adminPassword,
      role: 'admin'
    });

    res.json({ 
      success: true, 
      message: 'Database has been completely wiped. ONLY the Admin account (admin@zerowait.com / admin123) has been created. No fake restaurants or users exist anymore.' 
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
};
