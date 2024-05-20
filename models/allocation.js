const Joi = require("joi");
const mongoose = require("mongoose");

const productAllocationSchema = new mongoose.Schema({
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salesman",
    required: true,
  },
  products: [
    {
      variation: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ProductVariation",
      },
      quantity: {
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
