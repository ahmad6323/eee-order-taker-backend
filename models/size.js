const Joi = require("joi");
const mongoose = require("mongoose");

// Define the size schema
const sizeSchema = new mongoose.Schema({
  size: {
    type: String, // Define the allowed values
    required: true,
  },
});

// Create the Size model
const Size = mongoose.model("Size", sizeSchema);

// Validation function for Size
function validateSize(size) {
  const schema = {
    size: Joi.string().required(), // Use Joi validation with valid values
  };

  return Joi.validate(size, schema);
}

// Export the Size model and validate function
module.exports = {
  Size: Size,
  validate: validateSize,
};
