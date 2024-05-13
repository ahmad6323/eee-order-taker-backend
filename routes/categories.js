const express = require("express");
const router = express.Router();
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");

router.post("/", async (req, res) => {

  const { mainCategory, subCategory } = req.body;

  // check duplicate
  let existingCategory = await Category.findOne({ name: mainCategory });
  if (existingCategory) {
    return res.status(400).send("Category already exists.");
  }

  let catCount = await getCatCount();
  // If not, save the new category
  let category = new Category({
    name: mainCategory,
    sku: catCount.toString().padStart(4,'0')
  });

  category = await category.save();

  let subCatCount = await getSubCatCount();

  const addedSubCat = await Promise.all(subCategory.map(async (subCatName) => {
    let existingSubCat = await SubCategory.findOne({ name: subCatName });
    if (existingSubCat) {
      return;
    }
  
    // create sub-category
    let subCat = new SubCategory({
      name: subCatName,
      sku: subCatCount.toString().padStart(4, '0'),
      parent_id: category._id
    });
  
    subCat = await subCat.save();
  
    subCatCount = subCatCount + 1;
  
    return subCat._id;
  }));

  category = await Category.findByIdAndUpdate(
    category._id, 
    {
      $set: {
        subCategories: addedSubCat
      }
    },
    {
      new: true
    }
  );

  res.send(category);
});


router.get("/", async (req, res) => {
  const categories = await Category.find().sort("mainCategory").populate("subCategories");
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


// get sub categories by category ID
router.get("/get_subs/:cat_id", async (req, res) => {
  try {

    const category = await Category.findById(req.params.cat_id).populate("subCategories");

    if (!category) {
      return res.status(404).send("Category not found for the given subcategory.");
    }
    
    res.send(category);
  } catch (error) {
    console.error("Error finding category by subcategory:", error);
    res.status(500).send("Internal Server Error");
  }
});


async function getSubCatCount(){
  let count = await SubCategory.countDocuments({});
  return count++;
}

async function getCatCount(){
  let count = await Category.countDocuments({});
  return count++;
}


module.exports = router;
