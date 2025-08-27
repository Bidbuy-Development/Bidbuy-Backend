import { Buyer } from "../models/buyer.js";
import bcrypt from "bcryptjs";
import { generateJwtToken } from "../helpers/token.js";
import { successResponse, errorResponse } from "../helpers/response.js";
import { sendVerificationEmail } from "../helpers/sendEmail.js";
import { generateOtp } from "../utils/otp.js";
import { validatePassword, validateEmail } from "../utils/validators.js";
import logger from "../utils/logger.js";

// Buyer signup
const signUpBuyer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json(errorResponse("All fields are required."));
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse("Invalid email format"));
    }

    // Validate password using the utility function
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json(
        errorResponse("Password validation failed", {
          errors: [passwordValidation.message],
          field: "password",
        })
      );
    }

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(409).json(errorResponse("Email already in use."));
    }

    // Generate email verification token with configurable expiration
    const emailToken = generateOtp();
    // Set OTP expiration from environment variable or default to 5 minutes (in milliseconds)
    const otpExpirationMs = parseInt(process.env.OTP_EXPIRATION_MS) || 300000;
    const emailTokenExpires = Date.now() + otpExpirationMs;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new buyer
    const buyer = new Buyer({
      name,
      email,
      password: hashedPassword,
      emailToken,
      emailTokenExpires,
      isVerified: false,
      role: "Buyer",
    });

    // Save buyer to database
    try {
      await buyer.save();

      // Send verification email with buyer's name
      try {
        await sendVerificationEmail(buyer.email, emailToken, buyer.name);

        // Return success response
        return res.status(201).json(
          successResponse("Verification code sent to your email", {
            email: buyer.email,
            code: "SIGNUP_SUCCESS",
          })
        );
      } catch (emailError) {
        // Even if email fails, account is created, so return success
        logger.error("Failed to send verification email:", emailError);
        return res.status(201).json(
          successResponse(
            "Account created, but failed to send verification email",
            {
              email: buyer.email,
              code: "SIGNUP_SUCCESS_EMAIL_FAILED",
            }
          )
        );
      }
    } catch (saveError) {
      // Handle duplicate key error
      if (saveError.code === 11000) {
        return res.status(400).json(errorResponse("Email already in use"));
      }

      // Handle validation errors
      if (saveError.name === "ValidationError") {
        const messages = [];
        for (const field in saveError.errors) {
          messages.push(saveError.errors[field].message);
        }
        return res.status(400).json(
          errorResponse("Validation error", {
            error: messages[0],
            code: "VALIDATION_ERROR",
          })
        );
      }

      // Handle other errors
      throw saveError;
    }
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = [];
      for (const field in error.errors) {
        messages.push(error.errors[field].message);
      }
      return res.status(400).json(
        errorResponse("Validation error", {
          error: messages[0],
          code: "VALIDATION_ERROR",
        })
      );
    }

    // Handle other errors
    logger.error("Buyer signup error:", error);
    res.status(500).json(
      errorResponse("Signup failed", {
        errors:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
};

// Verify email with OTP
const verifyEmailBuyer = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Simple validation
    if (!email || !otp) {
      return res.status(400).json(errorResponse("Email and OTP are required"));
    }

    // Find buyer by email and include necessary fields
    const buyer = await Buyer.findOne({ email }).select(
      "+isVerified +emailToken +emailTokenExpires"
    );

    if (!buyer) {
      return res
        .status(400)
        .json(errorResponse("No account found with this email"));
    }

    // Check if already verified
    if (buyer.isVerified) {
      return res.status(200).json(
        errorResponse(
          "Your account is already verified. You can proceed to login.",
          {
            isVerified: true,
            code: "ALREADY_VERIFIED",
          }
        )
      );
    }

    // Check if OTP is present and matches
    if (!buyer.emailToken) {
      return res
        .status(400)
        .json(
          errorResponse("No verification code found. Please request a new one.")
        );
    }

    if (String(buyer.emailToken) !== String(otp)) {
      return res.status(400).json(errorResponse("Invalid verification code"));
    }

    if (buyer.emailTokenExpires < Date.now()) {
      return res
        .status(400)
        .json(errorResponse("Verification code has expired"));
    }

    try {
      // Update buyer status to mark as verified
      const updatedBuyer = await Buyer.findOneAndUpdate(
        { _id: buyer._id },
        {
          $set: {
            isVerified: true,
            verifiedAt: new Date(),
          },
          $unset: {
            emailToken: "",
            emailTokenExpires: "",
          },
        },
        { new: true, runValidators: false }
      );

      if (!updatedBuyer) {
        return res
          .status(400)
          .json(errorResponse("Failed to update buyer verification status"));
      }

      return res.json(
        successResponse(
          "Email verified successfully! You can now log in to your account."
        )
      );
    } catch (saveError) {
      throw saveError;
    }
  } catch (error) {
    logger.error("Buyer email verification error:", error);
    return res
      .status(500)
      .json(
        errorResponse("An error occurred while verifying your email", {
          error: error.message,
        })
      );
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse("Email is required"));
    }

    // Find buyer
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res
        .status(400)
        .json(errorResponse("No account found with this email"));
    }

    // Check if already verified
    if (buyer.isVerified) {
      return res
        .status(400)
        .json(
          errorResponse("Account is already verified", { isVerified: true })
        );
    }

    // Generate new OTP and expiration
    const emailToken = generateOtp();
    const otpExpirationMs = parseInt(process.env.OTP_EXPIRATION_MS) || 300000;
    const emailTokenExpires = Date.now() + otpExpirationMs;

    // Update buyer with new token
    await Buyer.findByIdAndUpdate(buyer._id, {
      emailToken,
      emailTokenExpires,
    });

    // Send verification email
    try {
      await sendVerificationEmail(buyer.email, emailToken, buyer.name);
      return res.json(successResponse("Verification code sent to your email"));
    } catch (emailError) {
      logger.error("Failed to send verification email:", emailError);
      return res
        .status(500)
        .json(
          errorResponse(
            "Failed to send verification email. Please try again later."
          )
        );
    }
  } catch (error) {
    logger.error("Resend verification error:", error);
    return res
      .status(500)
      .json(errorResponse("An error occurred while processing your request"));
  }
};

// Export the controller functions
export { signUpBuyer, verifyEmailBuyer, resendVerification };
