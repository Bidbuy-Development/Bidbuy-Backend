import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * @module middleware/validate
 * @description
 * Express middleware that processes validation results from express-validator.
 * This should be placed after your validation middleware and before your route handler.
 * 
 * @example
 * // In your route definitions:
 * import { validate } from '../middleware/validate';
 * import { validateVendorRegistration } from '../middleware/validations/vendor.validations';
 * 
 * router.post('/vendors', validateVendorRegistration, validate, vendorController.create);
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void|Response} Returns a 400 response if validation fails, otherwise calls next()
 * 
 * @see {@link module:utils/validators} - The validation functions used by the validation middleware
 * @see {@link module:middleware/validations/vendor.validations} - Example validation rules
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Format errors for response
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));
        
        // Log validation errors
        logger.warn('Validation failed', {
            path: req.path,
            method: req.method,
            errors: formattedErrors
        });
        
        // Return first error for now (can be modified to return all errors)
        const firstError = formattedErrors[0];
        return res.status(400).json({
            success: false,
            message: firstError.message,
            field: firstError.field,
            code: 'VALIDATION_ERROR',
            errors: formattedErrors // Include all errors for debugging
        });
    }
    
    next();
};

export { validate };
