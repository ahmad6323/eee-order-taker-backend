const Joi = require("joi");
const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
});

const Department = mongoose.model("Department", departmentSchema);

function validateDepartment(department) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
  };

  return Joi.validate(department, schema);
}

module.exports = {
  Department: Department,
  validate: validateDepartment, // Export the validate function
};
