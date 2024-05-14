const Joi = require("joi");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 40,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SubCategory",
  },
  department: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department",
    }
  ],
  variations: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ProductVariation",
    }
  ],
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl: {
    type: String,
  },
  description: {
    type: String,
    required: true,
    maxlength: 400,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
