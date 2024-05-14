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

    subCatCount++;
  
    subCat = await subCat.save();
  
  
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

router.put("/:category_id", async (req, res) => {

  try{
    
    const { mainCategory, subCategory } = req.body;
    
    const category = await Category.findById(req.params.category_id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let subCatCount = await getSubCatCount();

    for (const sub of subCategory) {
      if (!sub._id) {
        // Create new sub-category
        const newSubCategory = new SubCategory({
          name: sub.name,
          category_id: category._id,
          sku: subCatCount.toString().padStart(4,"0")
        });
        subCatCount++;
        await newSubCategory.save();
        category.subCategories.push(newSubCategory._id);
      } else {
        // Update existing sub-category
        await SubCategory.findByIdAndUpdate(sub._id, { name: sub.name });
      }
    }

    const mismatchedCats = subCats.filter(subCat => {
      // Check if the subCat is not new and has a valid _id
      if (subCat._id !== null) {
        // Check if the subCat is not present in mainCats
        return !mainCats.find(mainCat => mainCat._id === subCat._id);
      }
      return false; // Filter out new cats and cats without _id
    });

    // Remove deleted sub-categories not referred in products
    mismatchedCats.map(async (subId) => {
      const referredInProducts = await Product.findOne({ category: subId });
      if (!referredInProducts) {
        category.subCategories.filter(subCat => subCat._id !== subId);
        await SubCategory.findByIdAndDelete(subId);
        return false;
      }
    });

    console.log(category);
    
    await category.save();

    res.status(200).json({ message: 'Category updated successfully' })

  }catch(ex){
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
