import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Buyer } from "../models/buyer.js";
import { sendEmail } from "../config/email.js";
import { generateJwtToken } from "../helpers/token.js";
import { successResponse, errorResponse } from '../helpers/response.js'
import { sendVerificationEmail } from '../helpers/sendEmail.js';
import { generateOtp } from '../utils/otp.js';

import dotenv from "dotenv";
dotenv.config();

// ========== SIGNUP ==========
export const signUpBuyer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json(errorResponse("All fields are required."));
    }

    // Check if user already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(409).json(errorResponse("Email already in use."));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailToken = generateOtp();

    // Create buyer
    const newBuyer = await Buyer.create({
      name,
      email,
      password: hashedPassword,
      emailToken,
      isVerified: false,
    });

    // Send verification email
    await sendVerificationEmail(newBuyer.email, emailToken, newBuyer.name);

    res.status(201).json(successResponse("Signup successful. Please check your email to verify your account."));
  } catch (error) {
    res.status(500).json(errorResponse("Signup failed.", {error: error.message}));
  }
};

// ========== EMAIL VERIFICATION ==========
export const verifyEmailBuyer = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is missing." });
    }

    const buyer = await Buyer.findOne({ emailToken: token });
    if (!buyer) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    buyer.isVerified = true;
    buyer.emailToken = undefined;

    await buyer.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Email verification failed.", error: error.message });
  }
};

