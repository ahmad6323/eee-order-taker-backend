const Joi = require("joi");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  mainCategory: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  subCategory: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
});

const Category = mongoose.model("Category", categorySchema);

function validateCategory(category) {
  const schema = {
    mainCategory: Joi.string().min(3).max(50).required(),
    subCategory: Joi.string().min(3).max(50).required(),
  };

  return Joi.validate(category, schema);
}

module.exports = {
  Category: Category,
  validate: validateCategory,
};
