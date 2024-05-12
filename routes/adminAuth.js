const express = require("express");
const router = express.Router();
const { Admin } = require("../models/admin");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let admin = await Admin.findOne({ email: req.body.email });
  if (!admin) {
    // If admin not found
    return res.status(400).send("Admin email or password is invalid.");
  }

  // Check if the provided password matches the stored password
  const validPass = await bcrypt.compare(req.body.password, admin.password);
  if (!validPass) return res.status(400).send("Invalid email or password.");

  // If the password matches, generate a token
  const token = jwt.sign(
    {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    config.get("jwtpk")
  );

  res.send(token);
});

function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(8).max(255).required(),
  };

  return Joi.validate(req, schema);
}

module.exports = router;
