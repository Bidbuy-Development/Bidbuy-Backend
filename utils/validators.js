/**
 * @module validators
 * @description
 * This module contains pure validation functions that can be used throughout the application.
 * These functions are the single source of truth for validation logic and are used by
 * the validation middleware.
 * 
 * Each validator follows the same pattern:
 * @example
 * const { isValid, message } = validateSomething(value);
 * if (!isValid) {
 *   throw new Error(message);
 * }
 * 
 * @see {@link module:middleware/validate} - Express middleware that uses these validators
 * @see {@link module:middleware/validations/vendor.validations} - Route-specific validation rules
 */

// Validation patterns
const patterns = {
    phone: /^\+?[\d\s-]{1,16}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    objectId: /^[0-9a-fA-F]{24}$/,
    password: {
        minLength: 8,
        hasLower: /[a-z]/,
        hasUpper: /[A-Z]/,
        hasNumber: /\d/,
        hasSpecial: /[@$!%*?&]/
    }
};

/**
 * Validates a phone number
 * @param {string} phone - The phone number to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validatePhone = (phone) => {
    if (!phone) {
        return { isValid: false, message: 'Phone number is required' };
    }
    if (!patterns.phone.test(phone)) {
        return { isValid: false, message: 'Please provide a valid phone number (max 16 characters)' };
    }
    return { isValid: true, message: 'Phone number is valid' };
};

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validateEmail = (email) => {
    if (!email) {
        return { isValid: false, message: 'Email is required' };
    }
    if (!patterns.email.test(String(email).toLowerCase())) {
        return { isValid: false, message: 'Please provide a valid email' };
    }
    return { isValid: true, message: 'Email is valid' };
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < patterns.password.minLength) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!patterns.password.hasLower.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!patterns.password.hasUpper.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!patterns.password.hasNumber.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    if (!patterns.password.hasSpecial.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }
    
    return { isValid: true, message: 'Password is valid' };
};

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validateObjectId = (id) => {
    if (!id) {
        return { isValid: false, message: 'ID is required' };
    }
    if (!patterns.objectId.test(id)) {
        return { isValid: false, message: 'Invalid ID format' };
    }
    return { isValid: true, message: 'ID is valid' };
};

/**
 * Validates a name field
 * @param {string} name - The name to validate
 * @param {string} fieldName - The name of the field (for error messages)
 * @param {number} [min=2] - Minimum length
 * @param {number} [max=50] - Maximum length
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validateName = (name, fieldName = 'Name', min = 2, max = 50) => {
    if (!name) {
        return { isValid: false, message: `${fieldName} is required` };
    }
    if (name.length < min || name.length > max) {
        return { isValid: false, message: `${fieldName} must be between ${min} and ${max} characters` };
    }
    return { isValid: true, message: `${fieldName} is valid` };
};
