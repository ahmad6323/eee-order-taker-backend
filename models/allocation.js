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
    required: true,
  },
  allocations: [
    {
      name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 15,
      },
      sizes: {
        type: Map,
        of: {
          type: Number,
          default: 0,
        },
      },
    },
  ],
});

const ProductAllocation = mongoose.model(
  "ProductAllocation",
  productAllocationSchema
);

function validateProductAllocation(productAllocation) {
  const schema = {
    salesmanId: Joi.string().required(),
    productId: Joi.string().required(),
    allocations: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(15).required(),
          sizes: Joi.object()
            .pattern(Joi.string(), Joi.number().min(0).default(0))
            .required(),
        })
      )
      .required(),
  };

  return Joi.validate(productAllocation, schema);
}

module.exports = {
  ProductAllocation: ProductAllocation,
  validate: validateProductAllocation,
};
