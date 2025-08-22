// src/routes/user/cart.routes.ts
import express from 'express';
import * as CartCtrl from '../../controllers/user/cart.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = express.Router();

// Get current user's cart
router.get('/', protect, userOnly, CartCtrl.getCart);

// Add item to cart
router.post('/', protect, userOnly, CartCtrl.addToCart);

// Update quantity for a product in cart (variant optional)
router.patch('/:productId', protect, userOnly, CartCtrl.updateCartItemQty);

// Remove an item from cart (variant optional in body)
router.delete('/:productId', protect, userOnly, CartCtrl.removeFromCart);

// Clear entire cart
router.delete('/', protect, userOnly, CartCtrl.clearCart);

// Checkout (create order)
router.post('/checkout', protect, userOnly, CartCtrl.checkout);

export default router;
