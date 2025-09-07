import mongoose from "mongoose";

const buyerErrandSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
  },
  status: {
    type: String,
    enum: ["open", "assigned", "completed", "cancelled"],
    default: "open",
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

// Auto-update timestamps
buyerErrandSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const bidrequest = mongoose.model("BuyerErrand", buyerErrandSchema);
export default bidrequest;