// Database Schema for User 
import mongoose from "mongoose";

const buyerSchema =new mongoose.Schema({

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
    address: {
        type: String
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password not required if using Google OAuth
        },
        minlength: 6
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
        type: String // For storing user's profile picture URL
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    country: {
        type: String
    },
    emailToken: {
        type: String
    },
    otp: {
        type: String
    },
    otpVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

export const Buyer = mongoose.model('Buyer', buyerSchema);


// Vendor Model
const vendorSchema =new mongoose.Schema({

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
        minlength: 6
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
        type: String // For storing user's profile picture URL
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    },
    emailToken: {
        type: String
    },
    otp: {
        type: String
    },
    otpVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
