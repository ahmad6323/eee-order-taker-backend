const Joi = require("joi");
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "manager", "staff"], // Assuming these are the possible roles
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024, // Passwords are usually hashed, so we give a larger length
  },
});

const Admin = mongoose.model("Admin", adminSchema);

function validateAdmin(admin) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    role: Joi.string().valid("admin", "manager", "staff").required(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(admin, schema);
}

module.exports = {
  Admin: Admin,
  validate: validateAdmin,
};
