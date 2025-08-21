import { body, param } from 'express-validator';
import { 
    validateName, 
    validateEmail, 
    validatePhone, 
    validatePassword,
    validateObjectId 
} from '../../utils/validators.js';

/**
 * @module middleware/validations/buyer.validations
 * @description
 * Contains validation middleware for buyer-related routes.
 * These validations use express-validator and the validation functions from validators.js.
 * 
 * Each validation exports an array of middleware functions that:
 * 1. Validate specific fields using express-validator
 * 2. Use the validation functions from validators.js for custom validation
 * 3. Can be composed together as needed
 * 
 * @example
 * // In a route definition:
 * import { validateBuyerRegistration } from './middleware/validations/buyer.validations';
 * import { validate } from './middleware/validate';
 * 
 * router.post('/buyer', validateBuyerRegistration, validate, buyerController.create);
 * 
 * @see {@link module:utils/validators} - The underlying validation functions
 * @see {@link module:middleware/validate} - The validation result handler middleware
 */

/**
 * Validates buyer registration data
 * Uses express-validator with custom validators that use our validation utilities
 */
export const validateBuyerRegistration = [
    // Name validation
    body('name')
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validateName(value, 'Name');
            if (!isValid) throw new Error(message);
            return true;
        }),
    
    // Email validation
    body('email')
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validateEmail(value);
            if (!isValid) throw new Error(message);
            return true;
        })
        .normalizeEmail(),
    
    // Phone number validation (optional)
    body('phoneNumber')
        .optional({ checkFalsy: true })
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validatePhone(value);
            if (!isValid) throw new Error(message);
            return true;
        }),
    
    // Password validation (only if not using OAuth)
    body('password')
        .if((value, { req }) => !req.body.googleId)
        .custom(async (value) => {
            const { isValid, message } = validatePassword(value);
            if (!isValid) throw new Error(message);
            return true;
        })
];

/**
 * Validates buyer login data
 */
export const validateBuyerLogin = [
    // Email validation
    body('email')
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validateEmail(value);
            if (!isValid) throw new Error(message);
            return true;
        })
        .normalizeEmail(),
    
    // Password validation
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validates buyer update data
 */
export const validateBuyerUpdate = [
    // ID validation
    param('id')
        .custom(async (value) => {
            const { isValid, message } = validateObjectId(value);
            if (!isValid) throw new Error(message);
            return true;
        }),
    
    // Name validation (optional)
    body('name')
        .optional()
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validateName(value, 'Name');
            if (!isValid) throw new Error(message);
            return true;
        }),
    
    // Phone number validation (optional)
    body('phoneNumber')
        .optional()
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validatePhone(value);
            if (!isValid) throw new Error(message);
            return true;
        }),
    
    // Status validation (optional)
    body('status')
        .optional()
        .isIn(['pending', 'completed']).withMessage('Invalid status')
];

/**
 * Validates OTP verification data
 */
export const validateOtpVerification = [
    // Email validation
    body('email')
        .trim()
        .custom(async (value) => {
            const { isValid, message } = validateEmail(value);
            if (!isValid) throw new Error(message);
            return true;
        })
        .normalizeEmail(),
    
    // OTP validation - must be exactly 6 digits
    body('otp')
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters')
        .isNumeric().withMessage('OTP must contain only numbers')
        .matches(/^\d{6}$/).withMessage('OTP must be exactly 6 digits')
];
