const express = require("express");
const router = express.Router();
const { Salesman, validate } = require("../models/salesman");
const { Department } = require("../models/department");
let userData = null;
let verificationCode = 0;
let FPEmail = null;
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await Salesman.findOne({ email: req.body.email });
  if (user) return res.status(400).send("Email already registered!");

  const existingDepartment = await Department.findById(req.body.department);
  if (!existingDepartment) {
    return res.status(400).send("Invalid department.");
  }

  userData = req.body;
  console.log(userData);
  verificationCode = Math.floor(100000 + Math.random() * 900000);
  sendEmail(userData.email, verificationCode);
  res.send({
    success: true,
    message: "Email Send succefuly",
    email: userData.email,
  });

  // const { error } = validate(req.body);
  // if (error) return res.status(400).send(error.details[0].message);

  // const { name, cnic, phone, email, password, department } = req.body;

  // Check if salesman with the same email already exists
  // let existingSalesman = await Salesman.findOne({ email: email });
  // if (existingSalesman) {
  //   return res.status(400).send("Salesman with this email already exists.");
  // }

  // Check if department exists

  // If not, save the new salesman
  // let salesman = new Salesman({
  //   name: name,
  //   cnic: cnic,
  //   phone: phone,
  //   email: email,
  //   password: password,
  //   department: department,
  // });

  // salesman = await salesman.save();
  // res.send(salesman);
});

router.post("/code", async (req, res) => {
  try {
    if (req.body.forgotPassword === true && req.body.code) {
      if (verificationCode == req.body.code) {
        verificationCode = 0;
        return res.send({ Verify: "Email has been verified" });
      } else {
        return res.status(400).send("Invalid Verification Code!");
      }
    }
    if (verificationCode == req.body.code) {
      verificationCode = 0;
      let salesman = new Salesman({
        ...userData,
      });
      await salesman.save();

      res.send(true);
    } else return res.status(400).send("Invalid Verification Code!");
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
});

router.get("/resend", async (req, res) => {
  verificationCode = Math.floor(100000 + Math.random() * 900000);
  sendEmail(userData.email, verificationCode);
  res.send({ resend: true });
});

router.post("/forgot", async (req, res) => {
  const existingUser = await Salesman.findOne({ email: req.body.email });
  if (existingUser) {
    verificationCode = Math.floor(100000 + Math.random() * 900000);
    sendEmail(req.body.email, verificationCode);
    res.send({ resend: true });
    FPEmail = { email: req.body.email };
  } else {
    res.status(400).send("Invalid Email!");
  }
});

router.put("/updatePass", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Salesman.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    await user.save();
    res.status(200).json({ update: true });
    FPEmail = {};
    console.log("done");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  const salesman = await Salesman.find().populate("department").sort("name");
  res.send(salesman);
});
router.get("/:id", async (req, res) => {
  const salesman = await Salesman.findById(req.params.id);
  res.send(salesman);
});

router.delete("/:id", async (req, res) => {
  const salesman = await Salesman.findByIdAndRemove(req.params.id);
  if (!salesman)
    return res
      .status(404)
      .send("The salesman with the given ID was not found.");

  res.send(salesman);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { name, phone, email, password, department } = req.body;

  // Check if department exists
  const existingDepartment = await Department.findById(department);
  if (!existingDepartment) {
    return res.status(400).send("Invalid department.");
  }

  const salesman = await Salesman.findByIdAndUpdate(
    req.params.id,
    {
      name: name,
      phone: phone,
      email: email,
      password: password,
      department: department,
    },
    { new: true }
  );
  if (!salesman)
    return res
      .status(404)
      .send("The salesman with the given ID was not found.");

  res.send(salesman);
});

module.exports = router;
