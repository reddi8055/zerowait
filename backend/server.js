import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { initWhatsApp } from './utils/whatsapp.js';

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// ── Routes ─────────────────────────────────────────────────────
import authRoutes       from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes       from './routes/menuRoutes.js';
import adminRoutes      from './routes/adminRoutes.js';
import seedRoutes       from './routes/seedRoutes.js';
import bookingRoutes    from './routes/bookingRoutes.js';

app.use('/api/auth',        authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu',        menuRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/seed',        seedRoutes);
app.use('/api/bookings',    bookingRoutes);

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  // Initialise WhatsApp Web after server is up
  // QR code will appear in this terminal — scan it with your phone
  initWhatsApp();
});
