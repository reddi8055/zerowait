import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtBooking: { type: Number, required: true },
});

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true }],
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },
    city: { type: String },
    bookingTime: { type: String },
    waitingTimeStatus: { type: String },
    numberOfPeople: { type: Number, required: true },
    arrivalTime: { type: Date, required: false },
    status: {
      type: String,
      enum: ['confirmed', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'confirmed',
    },
    totalAmount: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    items: [OrderItemSchema],
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
