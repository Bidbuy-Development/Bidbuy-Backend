import express from 'express';
import { signup, verifyEmail, login } from '../controllers/vendor.js';

const router = express.Router();

// Seller authentication routes
router.post('/seller/signup', signup);
router.post('/seller/login', login);

// Email verification endpoint (requires email and OTP)
router.post('/verify-email', verifyEmail);

export default router;
