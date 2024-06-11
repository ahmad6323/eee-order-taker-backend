const express = require("express");
const router = express.Router();
const Color = require("../models/colors");

// POST operation to create a new size
router.post("/", async (req, res) => {
  // Validate the request body
  const { color } = req.body;

  // can be multiple
  var colors = color.split(",");
  let colorsAdded = [];

  colors.map(async (color) => {
    // Check if size with the same value already exists
    let existingColor = await Color.findOne({ color: color });
    if (!existingColor) {
      // If not, save the new size
      let newColor = new Color({
        color: color,
      });

      newColor = await newColor.save();
      colorsAdded.push(newColor);
    }
  });

  res.send(colorsAdded);
});

// update color
router.put("/:id", async (req, res) => {
  try {
    const { color } = req.body;

    let find = await Color.findById(req.params.id);

    if (!find) {
      return res.status(400).send("Invalid Request to update size");
    }

    let existing = await Color.findOne({
      color: color,
    });

    if (existing) {
      return res.status(400).send("Invalid Request to update size");
    }

    const newColor = await Color.findByIdAndUpdate(
      find._id,
      {
        color: color,
      },
      { new: true }
    );

    res.send(newColor);
  } catch (ex) {
    console.log(ex);
  }
});

// GET operation to retrieve all sizes
router.get("/", async (req, res) => {
  const colors = await Color.find();
  res.send(colors);
});

// DELETE operation to remove a size by ID
router.delete("/:id", async (req, res) => {
  const color = await Color.findByIdAndRemove(req.params.id);
  if (!color)
    return res.status(404).send("The color with the given ID was not found.");
  res.send(color);
});

module.exports = router;
