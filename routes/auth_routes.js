import express from 'express';
import { signup, verifyEmail } from '../controllers/vendor.js';
import {signUpBuyer, verifyEmailBuyer} from '../controllers/buyer.js';
import {
    validateBuyerRegistration,
    validateBuyerLogin
} from '../middleware/validations/buyer.validations.js';
import { 
    validateVendorRegistration, 
    validateVendorLogin, 
    validateOtpVerification 
} from '../middleware/validations/vendor.validations.js';
import { validate } from '../middleware/validate.js';
import { loginUser } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', validateBuyerLogin, validate, loginUser);
// Seller authentication routes with validation
router.post('/seller/signup', validateVendorRegistration, validate, signup);

// Buyer authentication routes with validation
router.post('/buyer/signup', validateBuyerRegistration, validate, signUpBuyer);


// Email verification endpoint with validation for vendors
router.post('/verify-email', validateOtpVerification, validate, verifyEmail);

// Email verification endpoint for buyers(It is a GET request because we are using a token to verify)
router.get('/verify-email-buyers', verifyEmailBuyer); 


export default router;
