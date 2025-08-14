import { Vendor } from '../models/vendor.js';
import { sendEmail } from '../config/email.js';
import { generateJwtToken } from '../helpers/token.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import emailTemplates from '../emailTemplate/emailTemplate.js';

// Generate 6-digit OTP
const generateEmailToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
const sendVerificationEmail = async (email, emailToken, name = 'there') => {
    const verificationTemplate = emailTemplates.welcomeTemplate(name, emailToken);
    
    await sendEmail(
        email,
        verificationTemplate.subject,
        verificationTemplate.html,
        `Your verification code is: ${emailToken}. Please enter this code in the verification page.`
    );
};

// Validate password requirements
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
};

// Vendor signup
const signup = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, state, country, address } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
                field: !name ? 'name' : !email ? 'email' : 'password'
            });
        }

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use',
                field: 'email'
            });
        }

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: passwordErrors,
                field: 'password'
            });
        }

        // Generate email verification token with 5-minute expiration
        const emailToken = generateEmailToken();
        const emailTokenExpires = Date.now() + 300000; // 5 minutes from now

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
            emailTokenExpires
        });

        // Save vendor to database
        await vendor.save();

        // Send verification email with user's name
        await sendVerificationEmail(vendor.email, emailToken, vendor.name);

        // Return only the email for verification
        res.status(201).json({
            success: true,
            message: 'Verification code sent to your email',
            email: vendor.email
        });

    } catch (error) {
        console.error('Signup error:', error);
        
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
        
        // Validate input
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and OTP are required',
                code: 'MISSING_FIELDS',
                fields: []
            });
        }
        console.log(`Verification request for email: ${email} with OTP`);

        // Find vendor by email
        const vendor = await Vendor.findOne({ email });

        if (!vendor) {
            console.error('No vendor found with the provided email');
            return res.status(400).json({ 
                success: false,
                message: 'No account found with this email',
                code: 'EMAIL_NOT_FOUND',
                field: 'email'
            });
        }

        // Check if already verified
        if (vendor.isVerified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified',
                code: 'ALREADY_VERIFIED'
            });
        }

        // Check if OTP matches and is not expired
        // Convert both to string for comparison to handle number/string mismatch
        if (String(vendor.emailToken) !== String(otp)) {
            console.log(`OTP Mismatch: Expected ${vendor.emailToken} (${typeof vendor.emailToken}), Got ${otp} (${typeof otp})`);
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

        // If we get here, all checks passed - verify the email

        try {
            // Update vendor status to completed and mark as verified using findOneAndUpdate
            // to bypass password validation
            console.log('Updating vendor verification status...');
            const updatedVendor = await Vendor.findOneAndUpdate(
                { _id: vendor._id },
                {
                    $set: {
                        status: 'completed',
                        isVerified: true,
                        verifiedAt: Date.now()
                    },
                    $unset: {
                        emailToken: "",
                        emailTokenExpires: ""
                    },
                    $addToSet: { usedTokens: otp } // Add the used OTP to prevent reuse
                },
                { new: true, runValidators: false }
            );
            
            if (!updatedVendor) {
                throw new Error('Failed to update vendor verification status');
            }
            
            console.log('Vendor verification status updated successfully');

            // Return success response
            return res.json({
                success: true,
                message: 'Email verified successfully! You can now log in to your account.'
            });
        } catch (saveError) {
            console.error('Error updating vendor verification status:', saveError);
            throw saveError;
        }
        
    } catch (error) {
        console.error('Email verification error:', error);
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

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
                field: !email ? 'email' : 'password'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address',
                field: 'email'
            });
        }

        // Check if vendor exists - use findOne with lean() to get a plain JS object
        // and explicitly include all fields we need
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

        // Get the full vendor document with password
        const fullVendor = await Vendor.findOne({ email })
            .select('+password +isVerified +status +emailToken')
            .lean();
            
        if (!fullVendor) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
                field: 'email'
            });
        }
        
        // Verify password using bcrypt directly
        const isPasswordValid = await bcrypt.compare(password, fullVendor.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
                field: 'password'
            });
        }

        // Check if email is verified using the full vendor document
        if (!fullVendor.isVerified) {
            // Check if we should resend verification
            if (fullVendor.status === 'pending' || !fullVendor.emailToken) {
                const emailToken = generateEmailToken();
                fullVendor.emailToken = emailToken;
                fullVendor.emailTokenExpires = Date.now() + 300000; // 5 minutes
                await fullVendor.save();
                
                await sendVerificationEmail(fullVendor.email, emailToken, fullVendor.name);
                
                return res.status(403).json({ 
                    success: false,
                    message: 'Please verify your email before logging in. A new verification code has been sent to your email.',
                    code: 'EMAIL_NOT_VERIFIED',
                    requiresVerification: true,
                    email: fullVendor.email,
                    field: 'email'
                });
            }
            
            return res.status(403).json({ 
                success: false,
                message: 'Please verify your email before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
                requiresVerification: true,
                email: fullVendor.email,
                field: 'email'
            });
        }

        // Generate JWT token with full vendor info
        const token = generateJwtToken(
            fullVendor._id,
            fullVendor.name,
            '24h' // Token expires in 24 hours
        );

        // Update last login timestamp without triggering validation
        await Vendor.findByIdAndUpdate(
            fullVendor._id,
            { $set: { lastLogin: Date.now() } },
            { runValidators: false }
        );

        // Prepare user response without sensitive data
        const userResponse = {
            id: fullVendor._id,
            name: fullVendor.name,
            email: fullVendor.email,
            role: fullVendor.role || 'vendor',
            isVerified: fullVendor.isVerified,
            status: fullVendor.status
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export { signup, verifyEmail, login };