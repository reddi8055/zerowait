import express from 'express';
import {
  createRestaurant,
  getRestaurants,
  getRestaurantDetails,
  getMyRestaurant,
  updateMyRestaurant,
  changePassword,
  addReview
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

export default router;
