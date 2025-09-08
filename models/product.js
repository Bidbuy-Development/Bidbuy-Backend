import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  image: {
    type: String, // file path or URL
  },

  amount: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  categories: [
    {
      type: String,
      trim: true,
    }
  ],

  location: {
    type: String,
    required: true,
    trim: true, // Example: "Lagos, Nigeria"
  },

  vendor: {
    type: Schema.Types.ObjectId,
    ref: "Vendor", // link to Vendor model
    required: true,
  },

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;