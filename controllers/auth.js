import { Buyer } from "../models/buyer.js";
import Vendor from '../models/vendor.js';
import { generateJwtToken } from '../helpers/token.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../config/email.js';
import { successResponse, errorResponse } from '../helpers/response.js'
import { validatePassword, validateEmail } from '../utils/validators.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../helpers/sendEmail.js';
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


// ========== FORGOTTEN PASSWORD FOR BOTH BUYERS AND VENDOR ==========
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json(errorResponse("Email is required"));

    const { isValid, message: emailError } = validateEmail(email);
    if (!isValid) return res.status(400).json(errorResponse(emailError));

    const user = await Vendor.findOne({ email }) || await Buyer.findOne({ email });
    if (!user) {
      // Don't reveal email existence
      return res.status(200).json(successResponse("If that email is registered, you will receive a password reset email shortly."));
    }

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await sendPasswordResetEmail(user.email, otp, user.name);

    res.status(200).json(successResponse("If that email is registered, you will receive a password reset email shortly."));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error."));
  }
};

// ========== VERIFY RESET OTP FOR BOTH BUYERS AND VENDOR ==========
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(errorResponse("Email and OTP are required"));
    }

    const user = await Vendor.findOne({ email }) || await Buyer.findOne({ email });
    if (!user) return res.status(400).json(errorResponse("Invalid request"));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (!user.otp || user.otp !== hashedOtp || user.otpExpires < Date.now()) {
      return res.status(400).json(errorResponse("Invalid or expired OTP"));
    }

    user.otp = undefined;
    user.otpExpires = undefined;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    res.status(200).json(successResponse("OTP verified. Use this token to reset password.", { resetToken }));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error."));
  }
};

// ========== RESET PASSWORD FOR BOTH BUYERS AND VENDOR ==========
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json(errorResponse("Token and new password are required"));
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json(errorResponse("Password does not meet security requirements"));
    }

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Find user with valid token (still not expired)
    const user = await Vendor.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: Date.now() },
    }) || await Buyer.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json(errorResponse("Invalid or expired reset token"));
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear token after reset
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    // Send confirmation email
    await sendPasswordResetSuccessEmail(user.email, user.name);

    res.status(200).json(successResponse("Password reset successful. You can now log in."));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error."));
  }
};
