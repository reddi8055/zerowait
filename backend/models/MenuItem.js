import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['starter', 'main', 'dessert', 'drink'], required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    prepTime: { type: Number, required: true }, // in minutes
    imageUrl: { type: String },
    isVegetarian: { type: Boolean, default: true },
    quantity: { type: String, default: '1 Portion' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
