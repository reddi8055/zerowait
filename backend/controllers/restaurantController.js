import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';

export const createRestaurant = async (req, res) => {
  try {
    const data = req.body;
    const existingUser = await User.findOne({ email: data.ownerEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this Owner Email already exists' });
    }
    const hashedPassword = await hashPassword(data.ownerPassword);
    const owner = await User.create({
      name: `${data.name} Owner`,
      email: data.ownerEmail,
      password: hashedPassword,
      role: 'restaurant'
    });
    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: data.name,
      cuisineType: data.cuisineType,
      mapX: data.mapX,
      mapY: data.mapY,
      address: data.address,
      capacity: data.capacity,
      isOpen: true,
      currentWaitTime: 0,
      rating: 5.0
    });
    const numTables = parseInt(data.numTables) || 0;
    if (numTables > 0) {
      const tablesToInsert = [];
      for (let i = 1; i <= numTables; i++) {
        tablesToInsert.push({ restaurantId: restaurant._id, tableName: `Table ${i}`, seats: 4, isAvailable: true });
      }
      await Table.insertMany(tablesToInsert);
    }
    res.status(201).json({ message: 'Restaurant and tables created successfully', restaurant });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
};

export const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

export const getRestaurantDetails = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    const tables = await Table.find({ restaurantId });
    const menuItems = await MenuItem.find({ restaurantId });
    res.json({ restaurant, tables, menuItems });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
};

export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'No restaurant found for this account' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
};

export const updateMyRestaurant = async (req, res) => {
  try {
    const allowed = ['name', 'cuisineType', 'address', 'phone', 'openingHours', 'description', 'imageUrl', 'isOpen', 'currentWaitTime'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user.id },
      { $set: updates },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user.id);
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = await hashPassword(newPassword);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment, bookingId } = req.body;
    const restaurantId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a valid rating between 1 and 5' });
    }

    // Verify the user has a served booking that hasn't been reviewed yet
    const Booking = (await import('../models/Booking.js')).default;
    const booking = await Booking.findOne({ _id: bookingId, userId: req.user.id, restaurantId, status: 'served' });

    if (!booking) {
      return res.status(400).json({ error: 'You can only review after your meal has been served.' });
    }
    if (booking.isReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this booking.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    // Add review
    const user = await (await import('../models/User.js')).default.findById(req.user.id);
    const review = {
      userId: req.user.id,
      userName: user ? user.name : 'Customer',
      rating: Number(rating),
      comment
    };

    restaurant.reviews.push(review);
    restaurant.totalReviews = restaurant.reviews.length;
    
    // Calculate new average
    const sum = restaurant.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    restaurant.rating = (sum / restaurant.reviews.length).toFixed(1);

    await restaurant.save();

    // Mark booking as reviewed
    booking.isReviewed = true;
    await booking.save();

    res.status(201).json({ message: 'Review added successfully', restaurant });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
};
