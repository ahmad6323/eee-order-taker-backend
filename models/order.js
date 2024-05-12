const Joi = require("joi");
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  salesman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salesman", // Reference to the Salesman model
    required: true,
  },
  pname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },
  pdepartment: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // Reference to the Department model
    },
    name: String,
  },
  pcategory: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Reference to the Category model
    },
    mainCategory: String,
    subCategory: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  color: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  size: {
    type: String,
    minlength: 1,
    maxlength: 20,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  pimage: [
    {
      type: String, // Array of image URLs
      required: true,
    },
  ],
  longitude: {
    type: String,
    required: true,
  },
  latitude: {
    type: String,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

function validateOrder(order) {
  const schema = Joi.array().items(
    Joi.object({
      salesman: Joi.string().required(),
      pname: Joi.string().min(3).max(255).required(),
      pdepartment: Joi.string().required(),
      pcategory: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      color: Joi.string().min(3).max(50),
      size: Joi.string().min(1).max(20),
      price: Joi.number().min(0).required(),
      pimage: Joi.array().items(Joi.string().required()).required(),
      longitude: Joi.number().required(),
      latitude: Joi.number().required(),
    })
  );

  return Joi.validate(order, schema);
}

module.exports = {
  Order: Order,
  validate: validateOrder,
};
