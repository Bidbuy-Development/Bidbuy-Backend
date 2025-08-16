import Vendor from '../models/vendor.js';
import { sendEmail } from '../config/email.js';
import { generateJwtToken } from '../helpers/token.js';
import bcrypt from 'bcryptjs';
import emailTemplates from '../emailTemplate/emailTemplate.js';
import logger from '../middleware/logger.js';
import { validatePassword, validateEmail } from '../utils/validators.js';

/**
 * Generates a 6-digit OTP (One-Time Password)
 * @returns {string} A 6-digit numeric string (e.g., '123456')
 */
const generateEmailToken = () => {
    // This generates a random number between 100000 and 999999 (inclusive)
    // and converts it to a string to ensure it's exactly 6 digits
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
const sendVerificationEmail = async (email, emailToken, name = 'there') => {
    try {
        const verificationTemplate = emailTemplates.welcomeTemplate(name, emailToken);
        
        await sendEmail(
            email,
            verificationTemplate.subject,
            verificationTemplate.html,
            `Your verification code is: ${emailToken}. Please enter this code in the verification page.`
        );
        // logger.info(`Verification email sent to ${email}`);
    } catch (error) {
        // logger.error(error, 'Error sending verification email');
        throw new Error('Failed to send verification email');
    }
};

// Vendor signup
const signup = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, state, country, address } = req.body;
        
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email })
            .maxTimeMS(10000) // 10 second timeout
            .catch(err => {
                throw new Error('Database operation timed out');
            });
            
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use',
                field: 'email',
                code: 'EMAIL_EXISTS'
            });
        }

        // Validate password using the utility function
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: [passwordValidation.message],
                field: 'password'
            });
        }

        // Generate email verification token with configurable expiration
        const emailToken = generateEmailToken();
        // Set OTP expiration from environment variable or default to 5 minutes (in milliseconds)
        const otpExpirationMs = parseInt(process.env.OTP_EXPIRATION_MS) || 300000;
        const emailTokenExpires = Date.now() + otpExpirationMs;

        // Create new vendor
        const vendor = new Vendor({
            name,
            email,
            password,
            phoneNumber,
            state,
            country,
            address,
            emailToken,
            emailTokenExpires,
            role: 'Vendor'
        });

        // Save vendor to database with timeout
        try {
            await vendor.save({ timeout: 10000 });
            
            // Send verification email with user's name
            try {
                await sendVerificationEmail(vendor.email, emailToken, vendor.name);
                
                // Return success response
                return res.status(201).json({
                    success: true,
                    message: 'Verification code sent to your email',
                    email: vendor.email,
                    code: 'SIGNUP_SUCCESS'
                });
                
            } catch (emailError) {
                // Even if email fails, account is created, so return success
                return res.status(201).json({
                    success: true,
                    message: 'Account created, but failed to send verification email',
                    email: vendor.email,
                    code: 'SIGNUP_SUCCESS_EMAIL_FAILED'
                });
            }
            
        } catch (saveError) {
            // Handle duplicate key error
            if (saveError.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use',
                    field: 'email',
                    code: 'EMAIL_EXISTS'
                });
            }
            
            // Handle validation errors
            if (saveError.name === 'ValidationError') {
                const messages = [];
                for (const field in saveError.errors) {
                    messages.push(saveError.errors[field].message);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: messages,
                    code: 'VALIDATION_ERROR'
                });
            }
            
            // Handle other errors
            throw saveError;
        }

    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = [];
            for (const field in error.errors) {
                messages.push(error.errors[field].message);
            }
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verify email with OTP
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Simple validation
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and OTP are required',
                field: !email ? 'email' : 'otp'
            });
        }

        // Find vendor by email and include necessary fields
        const vendor = await Vendor.findOne({ email })
            .select('+isVerified +status +emailToken +emailTokenExpires');

        if (!vendor) {
            return res.status(400).json({ 
                success: false,
                message: 'No account found with this email',
                code: 'EMAIL_NOT_FOUND',
                field: 'email'
            });
        }

        // Check if already verified by either isVerified flag or status
        if (vendor.isVerified || vendor.status === 'completed') {
            // If status is not updated, update it
            if (!vendor.isVerified) {
                await Vendor.updateOne(
                    { _id: vendor._id },
                    { $set: { isVerified: true } }
                );
            }
            
            return res.status(200).json({
                success: true,
                message: 'Your account is already verified. You can proceed to login.',
                code: 'ALREADY_VERIFIED',
                isVerified: true
            });
        }

        // Check if OTP is present and matches
        if (!vendor.emailToken) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new one.',
                code: 'NO_VERIFICATION_CODE',
                field: 'otp'
            });
        }

        if (String(vendor.emailToken) !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code',
                code: 'INVALID_OTP',
                field: 'otp'
            });
        }

        if (vendor.emailTokenExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired',
                code: 'OTP_EXPIRED',
                field: 'otp'
            });
        }

        try {
            // Update vendor status to completed and mark as verified
            const updatedVendor = await Vendor.findOneAndUpdate(
                { _id: vendor._id },
                {
                    $set: {
                        status: 'completed',
                        isVerified: true,
                        verifiedAt: new Date()
                    },
                    $unset: {
                        emailToken: "",
                        emailTokenExpires: ""
                    }
                },
                { new: true, runValidators: false }
            );
            
            if (!updatedVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update vendor verification status',
                    code: 'UPDATE_FAILED',
                    field: 'email'
                });
            }
            
            return res.json({
                success: true,
                message: 'Email verified successfully! You can now log in to your account.'
            });
            
        } catch (saveError) {
            throw saveError;
        }
        
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'An error occurred while verifying your email' 
        });
    }
};



// Vendor login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input using our utility function
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
                field: !email ? 'email' : 'password'
            });
        }

        const { isValid: isValidEmail, message: emailError } = validateEmail(email);
        if (!isValidEmail) {
            return res.status(400).json({
                success: false,
                message: emailError,
                field: 'email'
            });
        }

        // Find vendor with necessary fields for authentication
        const vendor = await Vendor.findOne({ email })
            .select('+password +isVerified +status +emailToken +emailTokenExpires +name +role')
            .lean();
            
        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                field: 'email',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, vendor.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
                field: 'password'
            });
        }

        // Check if email is verified
        if (!vendor.isVerified) {
            // If email is already verified but status wasn't updated
            if (vendor.status === 'completed' && !vendor.emailToken) {
                await Vendor.updateOne(
                    { _id: vendor._id },
                    { $set: { isVerified: true } }
                );
            } 
            // Resend verification if needed
            else if (vendor.status === 'pending' || !vendor.emailToken) {
                const emailToken = generateEmailToken();
                // Set OTP expiration from environment variable or default to 5 minutes (in milliseconds)
                const otpExpirationMs = parseInt(process.env.OTP_EXPIRATION_MS) || 300000;
                const emailTokenExpires = Date.now() + otpExpirationMs;
                
                await Vendor.updateOne(
                    { _id: vendor._id },
                    { 
                        $set: { 
                            emailToken,
                            emailTokenExpires,
                            status: 'pending'
                        } 
                    }
                );
                
                await sendVerificationEmail(vendor.email, emailToken, vendor.name);
                
                return res.status(403).json({ 
                    success: false,
                    message: 'Please verify your email before logging in. A new verification code has been sent to your email.',
                    code: 'EMAIL_NOT_VERIFIED',
                    requiresVerification: true,
                    email: vendor.email,
                    field: 'email'
                });
            }
            
            return res.status(403).json({ 
                success: false,
                message: 'Please verify your email before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
                requiresVerification: true,
                email: vendor.email,
                field: 'email'
            });
        }

        // Generate JWT token with vendor info
        const token = generateJwtToken(
            vendor._id,
            vendor.name, // Using vendor's name as fullName parameter
            process.env.JWT_EXPIRES_IN || '24h' // Token expiration from env or default to 24h
        );

        // Update last login timestamp
        await Vendor.findByIdAndUpdate(
            vendor._id,
            { $set: { lastLogin: new Date() } },
            { new: true, runValidators: false }
        );

        // Prepare user response without sensitive data
        const userResponse = {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            isVerified: vendor.isVerified,
            status: vendor.status
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
        
    } catch (error) {
        let errorMessage = 'Error during registration';
        
        if (error.name === 'ValidationError') {
            errorMessage = 'Validation failed';
        } else if (error.code === 11000) {
            errorMessage = 'Email already in use';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

// Export the controller functions
export { 
    signup,
    verifyEmail,
    login
};