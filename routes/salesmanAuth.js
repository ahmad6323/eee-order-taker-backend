const express = require("express");
const router = express.Router();
const { Salesman } = require("../models/salesman");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

router.post("/", async (req, res) => {
  console.log(7);
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await Salesman.findOne({ email: req.body.email });
  if (!user || req.body.password !== user.password) {
    // If user not found or password doesn't match
    return res.status(400).send("Salesman email or password is invalid.");
  }

  // If the password matches, generate a token
  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      cnic: user.cnic,
      phone: user.phone,
    },
    config.get("jwtpk")
  );

  res.send(token);
});

function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(150).required().email(),
    password: Joi.string().min(8).max(1150).required(),
  };

  return Joi.validate(req, schema);
}
module.exports = router;
