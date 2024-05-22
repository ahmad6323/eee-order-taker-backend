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
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  }
});

const SubCategory = mongoose.models.SubCategory || mongoose.model("SubCategory", subCatSchema);

module.exports = SubCategory;