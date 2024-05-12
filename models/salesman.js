const Joi = require("joi");
const mongoose = require("mongoose");

const salesmanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 15,
  },
  phone: {
    type: String,
    required: true,
    minlength: 11,
    maxlength: 11,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
});

const Salesman = mongoose.model("Salesman", salesmanSchema);

function validateSalesman(salesman) {
  const schema = {
    name: Joi.string().min(5).max(15).required(),
    phone: Joi.string().length(11).required(),
    email: Joi.string().required(),
    password: Joi.string().min(8).required(),
    department: Joi.string().required(), // Assuming department is validated separately
  };

  return Joi.validate(salesman, schema);
}

module.exports = {
  Salesman: Salesman,
  validate: validateSalesman,
};
