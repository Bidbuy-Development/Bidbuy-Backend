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
    hasSpecial: /[@$!%*?&]/,
  },
};

/**
 * Creates an error object manager that tracks validation status and messages.
 *
 * The error object follows this spec:
 * ```ts
 * {
 *   isValid: boolean,
 *   message: string | string[]
 * }
 * ```
 *
 * - `isValid` indicates whether the state is valid or not.
 * - `message` is either a single string or an array of error messages.
 *
 * @param {boolean} isValid - Initial validity state of the error.
 * @returns {[() => { isValid: boolean, message: string | string[] } | null, (message: string) => void]}
 * A tuple:
 * 1. A getter function to access the current error object (or `null` if not set yet).
 * 2. An updater function to add new error messages.
 *
 * @example
 * const [getError, updateError] = createError(false);
 * updateError("First error");
 * updateError("Second error");
 * console.log(getError());
 * // { isValid: false, message: ["First error", "Second error"] }
 *
 * @note
 * This function is needed to manage errors and improve user experience or developer experience, it would be nice if user get all errors at once rather than one by one.
 */
export function createError(isValid) {
  let error = null;

  function getError() {
    return error;
  }

  function updateError(message) {
    if (!error) {
      error = { isValid, message };
      return;
    }

    if (typeof error.message === 'string') {
      // TODO: test this and ensure it's working as expected
      const { isValid, message } = error;
      error = { isValid, messages: [error.message, message] };
      return;
    }

    if (Array.isArray(error.message)) {
      error = { ...error, message: [...error.message, message] };
    }
  }

  return [getError, updateError];
}

/**
 * Validates a phone number
 * @param {string} phone - The phone number to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validatePhone = (phone) => {
  const [getError, updateError] = createError(false);

  if (!phone) {
    updateError('Phone number is required');
  }
  if (!patterns.phone.test(phone)) {
    updateError('Please provide a valid phone number');
  }

  const error = getError();
  return error ?? { isValid: true, message: 'Phone number is valid' };
};

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validateEmail = (email) => {
  const [getError, updateError] = createError(false);

  if (!email) {
    updateError('Email is required');
  }
  if (!patterns.email.test(String(email).toLowerCase())) {
    updateError('Please provide a valid email');
  }
  const error = getError();
  return error ?? { isValid: true, message: 'Phone number is valid' };
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validatePassword = (password) => {
  const [getError, updateError] = createError(false);

  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < patterns.password.minLength) {
    updateError('Password must be at least 8 characters long');
  }

  if (!patterns.password.hasLower.test(password)) {
    updateError('Password must contain at least one lowercase letter');
  }

  if (!patterns.password.hasUpper.test(password)) {
    updateError('Password must contain at least one uppercase letter');
  }

  if (!patterns.password.hasNumber.test(password)) {
    updateError('Password must contain at least one number');
  }

  if (!patterns.password.hasSpecial.test(password)) {
    updateError('Password must contain at least one special character (@$!%*?&)');
  }

  const error = getError();
  return error ?? { isValid: true, message: 'Password is valid' };
};

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {{isValid: boolean, message: string}} Validation result
 */
export const validateObjectId = (id) => {
  const [getError, updateError] = createError(false);

  if (!id) {
    updateError('ID is required');
  }
  if (!patterns.objectId.test(id)) {
    updateError('Invalid ID format');
  }
  const error = getError();
  return error ?? { isValid: true, message: 'ID is valid' };
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
  const [getError, updateError] = createError(false);

  if (!name) {
    updateError(`${fieldName} is required`);
  }
  if (name.length < min || name.length > max) {
    updateError(`${fieldName} must be between ${min} and ${max} characters`);
  }

  const error = getError();
  return error ?? { isValid: true, message: `${fieldName} is valid` };
};
