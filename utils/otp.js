/**
 * Generates a 6-digit OTP (One-Time Password)
 * @returns {string} A 6-digit numeric string (e.g., '123456')
 */
export const generateOtp = () => {
    // This generates a random number between 100000 and 999999 (inclusive)
    // and converts it to a string to ensure it's exactly 6 digits
    return Math.floor(100000 + Math.random() * 900000).toString();
};