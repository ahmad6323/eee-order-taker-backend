const express = require("express");
const router = express.Router();
const Salesman = require("../models/salesman");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

router.post("/", async (req, res) => {
  let user = await Salesman.findOne({ email: req.body.email }).populate({
    path: "department",
    model: "Department",
    select: "name"
  });

  if (!user || req.body.password !== user.password) {
    return res.status(400).send("Salesman email or password is invalid.");
  }

  const departmentNames = user.department.map(dep => dep.name);

  // If the password matches,  generate a token
  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      cnic: user.cnic,
      phone: user.phone,
      role: user.role,
      departments: departmentNames.join(", ")
    },
    config.get("jwtpk")
  );

  res.send(token);
});

module.exports = router;
