import express from 'express';
import { getMenu, addMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('restaurant'), getMenu);
router.post('/', protect, authorize('restaurant'), addMenuItem);
router.delete('/:id', protect, authorize('restaurant'), deleteMenuItem);

export default router;
