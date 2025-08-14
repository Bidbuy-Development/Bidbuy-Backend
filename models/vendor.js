// Vendor Model
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
        type: String,
        validate: {
            validator: function(v) {
                return /^\+?[\d\s-]{1,16}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number! Must be max 16 characters.`
        }
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
        validate: {
            validator: function(v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
        }
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
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    isVerified: {
        type: Boolean,
        default: false,
        select: false // Hide this field by default
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
    },
    role: {
        type: String,
        default: "Vendor"
    },
    usedTokens: [{
        type: String,
        select: false // Hide this field by default
    }]
}, {
    timestamps: true,
    versionKey: false
});

// Method to compare password
vendorSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// Hash password before saving
vendorSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
