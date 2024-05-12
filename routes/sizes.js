const express = require("express");
const router = express.Router();
const { Size, validate } = require("../models/size");

// POST operation to create a new size
router.post("/", async (req, res) => {
  // Validate the request body
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { size } = req.body;

  // Check if size with the same value already exists
  let existingSize = await Size.findOne({ size: size });
  if (existingSize) {
    return res.status(400).send("Size with this value already exists.");
  }

  // If not, save the new size
  let newSize = new Size({
    size: size,
  });

  newSize = await newSize.save();
  res.send(newSize);
});

// GET operation to retrieve all sizes
router.get("/", async (req, res) => {
  const sizes = await Size.find().sort("size");
  res.send(sizes);
});

// DELETE operation to remove a size by ID
router.delete("/:id", async (req, res) => {
  const size = await Size.findByIdAndRemove(req.params.id);
  if (!size)
    return res.status(404).send("The size with the given ID was not found.");

  res.send(size);
});

module.exports = router;
