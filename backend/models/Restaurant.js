import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    cuisineType: { type: String, required: true },
    mapX: { type: Number, required: true },
    mapY: { type: Number, required: true },
    address: { type: String },
    phone: { type: String },
    openingHours: { type: String },
    isOpen: { type: Boolean, default: false },
    currentWaitTime: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    imageUrl: { type: String },
    description: { type: String },
    capacity: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
