const Joi = require("joi");
const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  color: {
    type: String, 
    required: true,
  },
});

const Color = mongoose.model("Color", colorSchema);

function validateSize(size) {
  const schema = {
    color: Joi.string().required(), 
  };

  return Joi.validate(size, schema);
}

module.exports = {
  Color: Color,
  validate: validateSize,
};
