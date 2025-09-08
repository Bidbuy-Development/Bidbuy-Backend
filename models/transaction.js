import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  // This can represent payment for a product checkout or a bid/errand
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  errand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BuyerErrand",
  },
  bid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bid",
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "NGN", // adjust as needed
  },
  type: {
    type: String,
    enum: ["product_purchase", "bid_payment", "escrow_release", "refund"],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["card", "bank_transfer", "wallet"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed", "refunded"],
    default: "pending",
  },
  transactionNumber: {
    type: String,
    unique: true,
    required: true,
  },
  reference: {
    type: String,
    unique: true, // e.g. Paystack/Stripe reference
  },
  escrow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Escrow",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

//  Pre-save hook to generate transaction number
transactionSchema.pre("save", async function (next) {
  if (!this.transactionNumber) {
    // Generate a secure random 6-digit number
    const randomNum = crypto.randomInt(100000, 999999);
    this.transactionNumber = `TXN_${randomNum}`;
  }
  next();
});

// Update `updatedAt` automatically
transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Transaction", transactionSchema);
