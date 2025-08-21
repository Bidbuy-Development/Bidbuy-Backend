import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Buyer } from "../models/buyer.js";
import { sendEmail } from "../config/email.js";
import { generateJwtToken } from "../helpers/token.js";

import dotenv from "dotenv";
dotenv.config();

// ========== SIGNUP ==========
export const signUpBuyer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if user already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailToken = crypto.randomBytes(32).toString("hex");

    // Create buyer
    const newBuyer = await Buyer.create({
      name,
      email,
      password: hashedPassword,
      emailToken,
      isVerified: false,
    });

    // Send verification email
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify-email-buyers?token=${emailToken}`;
    await sendEmail(
      email,
      "Verify your email",
      `<p>Please verify your email by clicking <a href="${verificationURL}">here</a>.</p>`,
      `Verify your email by visiting: ${verificationURL}`
    );

    res.status(201).json({
      message:
        "Signup successful. Please check your email to verify your account.",
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed.", error: error.message });
  }
};

// ========== LOGIN ==========
export const loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find buyer
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Check if verified
    if (!buyer.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, buyer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const token = generateJwtToken(
      buyer._id,
      buyer.name,
      process.env.JWT_EXPIRES_IN
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      data: { buyer },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
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

