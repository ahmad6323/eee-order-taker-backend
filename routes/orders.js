const express = require("express");
const router = express.Router();
const { Order, validate } = require("../models/order");
const { Department } = require("../models/department");
const { Category } = require("../models/category");
const { Product } = require("../models/product");
const { ProductAllocation } = require("../models/allocation");

// POST endpoint to create a new order
router.post("/", async (req, res) => {
  try {
    console.log(req.body);
    // Validate the request body
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Destructure the request body (assuming it's an array)
    const cartItems = req.body;

    try {
      // Create an array to store the saved orders
      const savedOrders = [];

      // Iterate over each cart item and save it to the database
      for (let item of cartItems) {
        // Fetch Department and Category objects using their IDs
        const department = await Department.findById(item.pdepartment);
        const category = await Category.findById(item.pcategory);

        // Fetch Product object using its ID
        const product = await Product.findById(item.pname);

        // Check if the product is allocated to the salesman
        const allocation = await ProductAllocation.findOne({
          salesmanId: item.salesman,
          productId: item.pname,
        });

        if (!allocation) {
          return res
            .status(400)
            .send("Product is not allocated to the salesman.");
        }

        const allocatedQuantityObj = allocation.allocations.find(
          (a) => a.name === item.color
        );
        if (!allocatedQuantityObj) {
          return res
            .status(400)
            .send("Allocation not found for the specified color.");
        }
        console.log(allocatedQuantityObj);

        const allocatedQuantity = allocatedQuantityObj.sizes.get(item.size);

        if (!allocatedQuantity || allocatedQuantity < item.quantity) {
          return res
            .status(400)
            .send(`Insufficient quantity of size ${item.size}.`);
        }

        // Reduce the allocated quantity of the appropriate size
        const allocatedIndex = allocation.allocations.findIndex(
          (a) => a.name === item.color
        );
        allocation.allocations[allocatedIndex].sizes.set(
          item.size,
          allocatedQuantity - item.quantity
        );

        await allocation.save();

        const {
          salesman,
          quantity,
          color,
          size,
          price,
          pimage,
          longitude,
          latitude,
        } = item;

        const order = new Order({
          salesman,
          pname: product.name,
          pdepartment: department,
          pcategory: category,
          quantity,
          color,
          size,
          price,
          pimage,
          longitude,
          latitude,
        });

        // Save the order to the database
        const savedOrder = await order.save();
        savedOrders.push(savedOrder);
      }

      // Send the saved orders back as a response
      res.send(savedOrders);
    } catch (error) {
      console.error("Error creating orders:", error);
      res.status(500).send("Internal Server Error");
    }
  } catch (error) {
    console.error("Error creating orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET endpoint to retrieve all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.send(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
