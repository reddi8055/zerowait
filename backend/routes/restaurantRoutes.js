import express from 'express';
import {
  createRestaurant,
  getRestaurants,
  getRestaurantDetails,
  getMyRestaurant,
  updateMyRestaurant,
  changePassword,
  addReview,
  getMyTables,
  updateMyTable
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getRestaurants);
router.post('/', protect, authorize('admin'), createRestaurant);
router.get('/mine', protect, authorize('restaurant'), getMyRestaurant);
router.patch('/mine', protect, authorize('restaurant'), updateMyRestaurant);
router.post('/change-password', protect, changePassword);
router.get('/:id', getRestaurantDetails);

// New endpoint for users to submit a review
router.post('/:id/reviews', protect, authorize('user'), addReview);

// Endpoints for individual table management
router.get('/mine/tables', protect, authorize('restaurant'), getMyTables);
router.patch('/mine/tables/:tableId', protect, authorize('restaurant'), updateMyTable);

export default router;
