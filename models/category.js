const Joi = require("joi");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  sku: {
    type: String,
    required: true,
  },
  subCategories: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "SubCategory",
    }
  ]
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
