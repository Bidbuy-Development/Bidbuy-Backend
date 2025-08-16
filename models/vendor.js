import mongoose from 'mongoose';
import { hashVendorPassword, addPasswordComparison } from '../middleware/hooks/vendor.hooks.js';

/**
 * Vendor Schema Definition
 * 
 * Fields:
 * - name: Vendor's full name
 * - email: Unique email address (used for login)
 * - phoneNumber: Contact number (optional)
 * - state/province: Vendor's state/province
 * - country: Vendor's country
 * - address: Physical address
 * - password: Hashed password (not required for OAuth)
 * - googleId: Google OAuth ID (if using Google login)
 * - provider: Authentication provider ('local' or 'google')
 * - avatar: URL to profile picture
 * - isAdmin: Boolean flag for admin privileges
 * - status: Account status ('pending' or 'completed')
 * - isVerified: Email verification status (hidden from queries by default)
 * - token: Authentication token
 * - emailToken: Token for email verification
 * - otp: One-time password for verification
 * - otpVerified: OTP verification status
 * - role: User role (default: "Vendor")
 * - lastLogin: Timestamp of last login
 * - verifiedAt: Timestamp when email was verified
 */
const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    address: {
        type: String
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password not required if using Google OAuth
        },
        select: false // Never return password in query results
    },
    googleId: {
        type: String,
        // sparse: true // Allow multiple null values but unique non-null values
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    avatar: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    token: {
        type: String,
    },
    emailToken: {
        type: String,
    },
    emailTokenExpires: {
        type: Date,
    },
    otp: {
        type: String,
    },
    otpVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        default: 'Vendor'
    },
    lastLogin: Date,
    verifiedAt: Date
}, {
    timestamps: true,
    versionKey: false
});

// Apply hooks and methods
hashVendorPassword(vendorSchema);
addPasswordComparison(vendorSchema);

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
