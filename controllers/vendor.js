import Vendor from '../models/vendor.js';
import { generateJwtToken } from '../helpers/token.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import { sendVerificationEmail } from '../helpers/sendEmail.js';
import { generateOtp } from '../utils/otp.js';
import { validatePassword, validateEmail } from '../utils/validators.js';
import { successResponse, errorResponse } from '../helpers/response.js'

// Vendor signup
const signup = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, state, country, address } = req.body;

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email })
            // .maxTimeMS(10000) // 10 second timeout
            // .catch(err => {
            //     throw new Error('Database operation timed out');
            // });

        if (existingVendor) {
            return res.status(400).json(errorResponse('Email already in use'));
        }

        // Validate password using the utility function
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json(
                errorResponse(
                    'Password validation failed',
                    {
                        errors: [passwordValidation.message],
                        field: 'password'
                    }
                )
            );
        }

        // Generate email verification token with configurable expiration
        const emailToken = generateOtp();
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
            await vendor.save();

            // Send verification email with user's name
            try {
                await sendVerificationEmail(vendor.email, emailToken, vendor.name);

                // Return success response
                return res.status(201).json(successResponse(
                    'Verification code sent to your email',
                    {
                        email: vendor.email,
                        code: 'SIGNUP_SUCCESS'
                    }
                ));

            } catch (emailError) {
                // Even if email fails, account is created, so return success
                // console.log(emailError)
                return res.status(201).json(successResponse(
                    'Account created, but failed to send verification email',
                    {
                        email: vendor.email,
                        code: 'SIGNUP_SUCCESS_EMAIL_FAILED'
                    }
                ));
            }

        } catch (saveError) {
            // Handle duplicate key error
            if (saveError.code === 11000) {
                return res.status(400).json(errorResponse('Email already in use'));
            }

            // Handle validation errors
            if (saveError.name === 'ValidationError') {
                const messages = [];
                for (const field in saveError.errors) {
                    messages.push(saveError.errors[field].message);
                }
                return res.status(400).json(errorResponse(
                    'Validation error',
                    {
                        error: messages[0],
                        code: 'VALIDATION_ERROR'
                    }
                ));
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
            return res.status(400).json(errorResponse(
                'Validation error',
                {
                    error: messages[0],
                    code: 'VALIDATION_ERROR'
                }
            ));
        }

        // Handle other errors
        res.status(500).json(errorResponse(
            'Validation error',
            {
                errors: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        ));
    }
};

// Verify email with OTP
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Simple validation
        if (!email || !otp) {
            return res.status(400).json(errorResponse(
                'Email and OTP are required',
            ));
        }

        // Find vendor by email and include necessary fields
        const vendor = await Vendor.findOne({ email })
            .select('+isVerified +status +emailToken +emailTokenExpires');

        if (!vendor) {
            return res.status(400).json(errorResponse('No account found with this email'));
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

            return res.status(200).json(errorResponse(
                'Your account is already verified. You can proceed to login.',
                {
                    isVerified: true,
                    code: 'ALREADY_VERIFIED',
                }
            ));
        }

        // Check if OTP is present and matches
        if (!vendor.emailToken) {
            return res.status(400).json(errorResponse(
                'No verification code found. Please request a new one.',
            ));
        }

        if (String(vendor.emailToken) !== String(otp)) {
            return res.status(400).json(errorResponse(
                'Invalid verification code',
            ));
        }

        if (vendor.emailTokenExpires < Date.now()) {
            return res.status(400).json(errorResponse(
                'Verification code has expired',
            ));
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
                return res.status(400).json(errorResponse(
                    'Failed to update vendor verification status',
                ));
            }

            return res.json(successResponse(
                'Email verified successfully! You can now log in to your account.',
            ));

        } catch (saveError) {
            throw saveError;
        }

    } catch (error) {
        return res.status(500).json(errorResponse(
            'An error occurred while verifying your email',
            { error: error.message }
        ));
    }
};


// Export the controller functions
export {
    signup,
    verifyEmail,
};