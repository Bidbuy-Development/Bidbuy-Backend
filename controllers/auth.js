import { Buyer } from "../models/buyer.js";
import Vendor from '../models/vendor.js';
import { generateJwtToken } from '../helpers/token.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../config/email.js';
import { successResponse, errorResponse } from '../helpers/response.js'
import { validatePassword, validateEmail } from '../utils/validators.js';
import { sendVerificationEmail } from '../helpers/sendEmail.js';
import { generateOtp } from '../utils/otp.js';

// ========== LOGIN FOR BOTH BUYERS AND VENDOR ==========
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    const { isValid: isValidEmail, message: emailError } = validateEmail(email);
    if (!isValidEmail) {
      return res.status(400).json(errorResponse(emailError));
    }

    // Search Vendor first (preference), then Buyer (if vendor not found)
    let foundUser = await Vendor.findOne({ email })
      .select('+password +isVerified +status +emailToken +emailTokenExpires +name +role')
      .lean();
    let userModel = Vendor;
    let userType = 'vendor';

    if (!foundUser) {
      foundUser = await Buyer.findOne({ email })
        .select('+password +isVerified +status +emailToken +emailTokenExpires +name +role')
        .lean();
      userModel = Buyer;
      userType = 'buyer';
    }

    // Not found in either collection
    if (!foundUser) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    // Compare password (supporting either `password` or `passwordHash`)
    const hashedPassword = foundUser.password || foundUser.passwordHash;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return res.status(400).json(errorResponse('Invalid email or password'));
    }

    // Email verification flow (same logic but using correct model)
    if (!foundUser.isVerified) {
      // If email already verified but status not updated
      if (foundUser.status === 'completed' && !foundUser.emailToken) {
        await userModel.updateOne(
          { _id: foundUser._id },
          { $set: { isVerified: true } }
        );
      }
      // Resend verification if needed
      else if (foundUser.status === 'pending' || !foundUser.emailToken) {
        const emailToken = generateOtp();
        const otpExpirationMs = parseInt(process.env.OTP_EXPIRATION_MS) || 300000;
        const emailTokenExpires = Date.now() + otpExpirationMs;

        await userModel.updateOne(
          { _id: foundUser._id },
          {
            $set: {
              emailToken,
              emailTokenExpires,
              status: 'pending'
            }
          }
        );

        await sendVerificationEmail(foundUser.email, emailToken, foundUser.name);

        return res.status(403).json(errorResponse(
          'Please verify your email before logging in. A new verification code has been sent to your email.',
          {
            requiresVerification: true,
            email: foundUser.email,
            role: userType
          }
        ));
      }

      return res.status(403).json(errorResponse(
        'Please verify your email before logging in.',
        {
          requiresVerification: true,
          email: foundUser.email,
          role: userType
        }
      ));
    }

    // Generate token and update lastLogin on the correct model
    const token = generateJwtToken(
      foundUser._id,
      foundUser.name,
      process.env.JWT_EXPIRES_IN || '24h'
    );

    await userModel.findByIdAndUpdate(
      foundUser._id,
      { $set: { lastLogin: new Date() } },
      { new: true, runValidators: false }
    );

    const userResponse = {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role || userType,
      isVerified: foundUser.isVerified,
      status: foundUser.status
    };

    return res.status(200).json(successResponse(
      'Login successful',
      {
        token,
        user: userResponse
      }
    ));

  } catch (error) {
    return res.status(500).json(errorResponse(
      'Uknown Server Error Occoured',
      {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    ));
  }
};
