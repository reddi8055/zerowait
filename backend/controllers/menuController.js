import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

export const getMenu = async (req, res) => {
  try {
    // Find their restaurant
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Find the menu items
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
    
    res.json({ menuItems, restaurantName: restaurant.name });
  } catch (error) {
    console.error('Menu GET Error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};

export const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    const data = req.body;
    const newItem = await MenuItem.create({
      restaurantId: restaurant._id,
      name: data.name,
      category: data.category,
      price: data.price,
      originalPrice: data.originalPrice || data.price,
      prepTime: data.prepTime || 10,
      imageUrl: data.imageUrl,
      isVegetarian: data.isVegetarian !== undefined ? data.isVegetarian : true,
      quantity: data.quantity || '1 Portion',
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Menu POST Error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: restaurant._id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
