const Joi = require("joi");
const mongoose = require("mongoose");

const subCatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  sku: {
    type: String,
    required: true, 
  }
});

const SubCategory = mongoose.model("SubCategory", subCatSchema);

module.exports = SubCategory;
