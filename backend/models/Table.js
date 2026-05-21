import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableName: { type: String, required: true },
    seats: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Table || mongoose.model('Table', TableSchema);
