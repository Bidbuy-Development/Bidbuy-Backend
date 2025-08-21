import express from 'express';
import { signup, verifyEmail, login } from '../controllers/vendor.js';
import {signUpBuyer, loginBuyer, verifyEmailBuyer} from '../controllers/buyer.js';
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

const router = express.Router();

// Seller authentication routes with validation
router.post('/seller/signup', validateVendorRegistration, validate, signup);
router.post('/seller/login', validateVendorLogin, validate, login);

// Buyer authentication routes with validation
router.post('/buyer/signup', validateBuyerRegistration, validate, signUpBuyer);
router.post('/buyer/login', validateBuyerLogin, validate, loginBuyer);


// Email verification endpoint with validation for vendors
router.post('/verify-email', validateOtpVerification, validate, verifyEmail);

// Email verification endpoint for buyers(It is a GET request because we are using a token to verify)
router.get('/verify-email-buyers', verifyEmailBuyer); 


export default router;
