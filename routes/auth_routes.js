import express from 'express';
import { signup, verifyEmail } from '../controllers/vendor.js';
import {signUpBuyer, verifyEmailBuyer} from '../controllers/buyer.js';
import {
    validateBuyerRegistration,
    validateLogin
} from '../middleware/validations/buyer.validations.js';
import { 
    validateVendorRegistration, 
    validateVendorLogin, 
    validateOtpVerification 
} from '../middleware/validations/vendor.validations.js';
import { validate } from '../middleware/validate.js';
import { forgotPassword, loginUser,verifyResetOtp, resetPassword } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', validateLogin, validate, loginUser);
// Seller authentication routes with validation
router.post('/seller/signup', validateVendorRegistration, validate, signup);

// Buyer authentication routes with validation
router.post('/buyer/signup', validateBuyerRegistration, validate, signUpBuyer);


// Email verification endpoint with validation for vendors
router.post('/verify-email', validateOtpVerification, validate, verifyEmail);

// Email verification endpoint for buyers(It is a GET request because we are using a token to verify)
router.post('/verify-email-buyers', verifyEmailBuyer); 


//forgotten password route for both buyers and vendors
router.post('/forgot-password',forgotPassword);

 //verify reset otp route for both buyers and vendors
router.post('/verify-reset-otp',verifyResetOtp);

//reset password route for both buyers and vendors
router.post('/reset-password',resetPassword);
export default router;
