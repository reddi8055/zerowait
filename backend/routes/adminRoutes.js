import express from 'express';
import { getStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);

export default router;
