const express = require("express");
const router = express.Router();
const Salesman = require("../models/salesman");
const Department = require("../models/department");
let userData = null;
let verificationCode = 0;
const sendEmail = require("../utils/sendEmail");
const Order = require("../models/order");
const fs = require('fs');
const path = require('path');
const ProductAllocation = require("../models/allocation");


router.post("/", async (req, res) => {
  try{
    let user = await Salesman.findOne({ email: req.body.email });
    if (user) return res.status(400).send("Email already registered!");
  
    const foundDeparts = await Department.find({
      _id: { $in: req.body.department }
    }).select('_id');
  
    if(foundDeparts.length !== req.body.department.length){
      return res.status(400).send("Department not found");
    }
  
    const { image, name  } = req.body;
    const timestamp = new Date().getTime();
    const imageName = `${name}_${timestamp}_salesman.png`;
    if(image){
      const buffer = Buffer.from(image, 'base64');
      const imagePath = path.join(__dirname, '../public/salesman', imageName);
  
      fs.writeFile(imagePath, buffer, err => {
        if (err) {
          console.error('Error saving the image:', err);
        }
      });
    }
  
    userData = req.body;
    userData.image = imageName;
  
    let salesman = new Salesman({
      ...userData,
    });
    
    salesman = await salesman.save();
  
    return res.send(salesman);
  }catch(ex){
    console.log(ex);
    res.status(500).send("Internal server error");
  }
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

    if (verificationCode === parseInt(req.body.code)) {
      verificationCode = 0;
      let salesman = new Salesman({
        ...userData,
      });

      salesman = await salesman.save();

      return res.send(salesman);
    } else {
      console.log("codes matched failed");
      return res.status(400).send("Invalid Verification Code!");
    }
  } catch (error) {
    console.log(error);
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
  try{
    const salesman = await Salesman.find().populate("department").sort("name");
    res.send(salesman);
  }catch(ex){
    console.log(error);
    res.status(500);
  }
});

router.get("/:id", async (req, res) => {
  try{
    const salesman = await Salesman.findById(req.params.id);
    res.send(salesman);
  }catch(error){
    console.log(error);
    res.status(500);
  }
});

router.delete("/:id", async (req, res) => {
  try{
    let salesman = await Salesman.findById(req.params.id);
  
    if (!salesman){
      return res.status(404).send("The salesman with the given ID was not found.");
    }

    // remove product allocations
    await ProductAllocation.find({
      salesmanId: salesman._id
    }).deleteMany();

    salesman = await Salesman.findByIdAndDelete(salesman._id);
  
    res.send(salesman);
  }catch(ex){
    console.log(ex);
    res.status(500);
  }
});

router.put("/:id", async (req, res) => {

  const { name, phone, email, password, department } = req.body;

  // Check if department exists
   const foundDeparts = await Department.find({
    _id: { $in: req.body.department }
  }).select('_id');

  if(foundDeparts.length !== req.body.department.length){
    return res.status(400).send("Department not found");
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



// GET endpoint to retrieve all orders
router.get("/dashboard_content/:id", async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find({ 'items.salesman': req.params.id });

    let totalSales = calculateTotalBill(orders);

    const data = {
      totalSales: formatPrice(totalSales),
      orders: orders.length,
    };

    res.send(data);

  } catch (err) {
    console.error('Error processing orders:', err);
  }
});


// utility

// format price
const formatPrice = (price)=>{
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'PKR',
  })
}
// calculate total sales - admin
function calculateTotalBill(data) {
  let totalSales = 0;
  data.map((item)=>{
    totalSales = totalSales + getPriceFromString(item.totalPrice);
  });
  return totalSales
}

const getPriceFromString = (priceString)=>{
  return parseInt(priceString.replace(/[^0-9.-]+/g, ''), 10);
}

module.exports = router;
