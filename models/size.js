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

module.exports = Size;
