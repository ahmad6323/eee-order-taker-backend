const express = require("express");
const router = express.Router();
const { Category, validate } = require("../models/category");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { mainCategory, subCategory } = req.body;

  // Check if category with the same mainCategory and subCategory already exists
  let existingCategory = await Category.findOne({ mainCategory, subCategory });
  if (existingCategory) {
    return res.status(400).send("Category already exists.");
  }

  // If not, save the new category
  let category = new Category({
    mainCategory,
    subCategory,
  });

  category = await category.save();
  res.send(category);
});

router.get("/", async (req, res) => {
  const categories = await Category.find().sort("mainCategory");
  res.send(categories);
});

router.get("/:subcategory", async (req, res) => {
  const { subcategory } = req.params; // Access subcategory from req.params
  try {
    const category = await Category.findOne({ subCategory: subcategory });
    if (!category) {
      return res
        .status(404)
        .send("Category not found for the given subcategory.");
    }
    res.send(category);
  } catch (error) {
    console.error("Error finding category by subcategory:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  const category = await Category.findByIdAndRemove(req.params.id);
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found.");

  res.send(category);
});

router.get("/subcategory/:subcategory", async (req, res) => {
  const { subcategory } = req.body; // Access subcategory from req.query
  console.log(subcategory);
  try {
    const category = await Category.findOne({ subCategory: subcategory });
    if (!category) {
      return res
        .status(404)
        .send("Category not found for the given subcategory.");
    }
    res.send(category);
  } catch (error) {
    console.error("Error finding category by subcategory:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { mainCategory, subCategory } = req.body;

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      mainCategory,
      subCategory,
    },
    { new: true }
  );
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found.");

  res.send(category);
});

module.exports = router;
