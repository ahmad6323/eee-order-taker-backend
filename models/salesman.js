const Joi = require("joi");
const mongoose = require("mongoose");

const salesmanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    default: "salesman",
  },
  department: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    }
  ],
});

const Salesman = mongoose.model("Salesman", salesmanSchema);

module.exports = Salesman;
