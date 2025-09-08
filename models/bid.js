import mongoose from "mongoose";

const biddingSchema = new mongoose.Schema({
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Buyer", 
    required: true 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Vendor", 
    required: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",   // can also be "Errand" if you have a separate model
    required: true 
  },
  bidAmount: { 
    type: Number, 
    required: true 
  },
  message: { 
    type: String, 
    maxlength: 500 
  }, // optional note from vendor

  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected"], 
    default: "pending" 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// auto-update timestamp
biddingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Bidding", biddingSchema);
