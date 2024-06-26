const Joi = require("joi");
const mongoose = require("mongoose");

const productAllocationSchema = new mongoose.Schema({
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salesman",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true
  },
  products: [
    {
      variation: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ProductVariation",
      },
      quantity: {
        type: Number
      },
      remaining: {
        type: Number
      }
    }
  ],
});

const ProductAllocation = mongoose.model(
  "ProductAllocation",
  productAllocationSchema
);


module.exports = ProductAllocation;
