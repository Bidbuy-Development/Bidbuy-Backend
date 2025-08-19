import express from 'express';
import { signup, verifyEmail, login } from '../controllers/vendor.js';
import { 
    validateVendorRegistration, 
    validateVendorLogin, 
    validateOtpVerification 
} from '../middleware/validations/vendor.validations.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Seller authentication routes with validation
router.post('/seller/signup', validateVendorRegistration, validate, signup);
router.post('/seller/login', validateVendorLogin, validate, login);

// Email verification endpoint with validation
router.post('/verify-email', validateOtpVerification, validate, verifyEmail);

export default router;
