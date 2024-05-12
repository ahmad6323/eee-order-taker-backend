const express = require("express");
const router = express.Router();
const { ProductAllocation, validate } = require("../models/allocation");
const { Product } = require("../models/product");
const { Salesman } = require("../models/salesman");

// Create a new product allocation
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { salesmanId, productId, allocations } = req.body;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).send("Salesman not found");
    }

    // Check if the requested quantities are available
    for (const allocation of allocations) {
      const { name, sizes } = allocation;
      const productColor = product.colors.find((c) => c.name === name);
      if (!productColor) {
        return res
          .status(400)
          .send(`Color '${name}' not available for product`);
      }

      for (const [size, quantity] of Object.entries(sizes)) {
        if (productColor.sizes[size] < quantity) {
          return res
            .status(400)
            .send(`Requested quantity for size '${size}' exceeds availability`);
        }
      }
    }

    // Update product quantities
    for (const allocation of allocations) {
      const { name, sizes } = allocation;
      const productColor = product.colors.find((c) => c.name === name);
      for (const [size, quantity] of Object.entries(sizes)) {
        productColor.sizes[size] -= quantity;
      }
    }
    await product.save();

    // Create product allocation
    const productAllocation = new ProductAllocation({
      salesmanId,
      productId,
      allocations,
    });
    await productAllocation.save();

    res.status(201).send(productAllocation);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Get all product allocations
router.get("/", async (req, res) => {
  try {
    const productAllocations = await ProductAllocation.find()
      .populate("salesmanId", "name")
      .populate("productId", "name");

    res.send(productAllocations);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get product allocation by ID
router.get("/:id", async (req, res) => {
  try {
    const productAllocation = await ProductAllocation.findById(req.params.id);
    if (!productAllocation) {
      return res.status(404).send("Product allocation not found");
    }
    res.send(productAllocation);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete product allocation by ID
router.delete("/:id", async (req, res) => {
  try {
    const productAllocation = await ProductAllocation.findById(req.params.id);
    if (!productAllocation) {
      return res.status(404).send("Product allocation not found");
    }

    // Increment product quantities based on allocations
    const product = await Product.findById(productAllocation.productId);
    for (const allocation of productAllocation.allocations) {
      const { name, sizes } = allocation;
      const productColor = product.colors.find((c) => c.name === name);
      for (const [size, quantity] of Object.entries(sizes)) {
        productColor.sizes[size] += quantity;
      }
    }
    await product.save();

    await ProductAllocation.findByIdAndRemove(req.params.id);
    res.send(productAllocation);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
