const express = require("express");
const router = express.Router();
const Category = require("../models/category");
const SubCategory = require('../models/subcategory'); 
const Product = require("../models/product");

router.post("/", async (req, res) => {

  try{
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

      let existingSubCat = await SubCategory.findOne({ name: subCatName.name });
      if (existingSubCat) {
        return;
      }
      
      // create sub-category
      let subCat = new SubCategory({
        name: subCatName.name,
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

  }catch(ex){
    console.log(ex);
    res.status(500).send("Error");
  }
});


router.get("/", async (req, res) => {
  try{
    const categories = await Category.find().sort("name").populate("subCategories");
    res.send(categories);
  }catch(ex){
    console.log(ex);
    res.status(500).send("Error");
  }
});

router.get("/sub_cats", async (req, res) => {
  try{
    const categories = await SubCategory.find().sort("name").populate("parent_id");
    res.send(categories);
  }catch(ex){
    console.log(ex);
    res.status(500).send("Error");
  }
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
    let newAddedSubCats = [];
    for (const sub of subCategory) {
      if (!sub._id) {
        // Create new sub-category
        const newSubCategory = new SubCategory({
          name: sub.name,
          parent_id: category._id,
          sku: subCatCount.toString().padStart(4,"0")
        });
        subCatCount++;
        await newSubCategory.save();
        newAddedSubCats.push(newSubCategory._id);
      } else {
        // Update existing sub-category
        await SubCategory.findByIdAndUpdate(sub._id, { name: sub.name });
      }
    }

    const missingSubCategories = category.subCategories.filter(originalSubCat => {
      return !subCategory.some(updatedSubCat => {
        return updatedSubCat._id === originalSubCat.toString();
      });
    });
    
    // Remove deleted sub-categories not referred in products
    if(missingSubCategories.length > 0){
      missingSubCategories.map(async (subId) => {
        if(subId === undefined) return; 
        const referredInProducts = await Product.findOne({ category: subId });
        if (!referredInProducts) {
          category.subCategories.filter((subCat)=>{
            return subCat.toString() !== subId.toString()
          });
          await SubCategory.findByIdAndDelete(subId);
        }
      });
    }
    
    // maybe name is changed
    category.name = mainCategory;
    if(newAddedSubCats.length > 0){
      category.subCategories.push(newAddedSubCats);
    }
    
    await Category.findByIdAndUpdate(req.params.category_id,{
      $set: category
    });

    res.status(200).json({ message: 'Category updated successfully' })

  }catch(ex){
    console.error(ex);
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
  let lastDoc = await SubCategory.find().limit(1).sort({$natural:-1})
  if(lastDoc.length === 0){
    return 1;
  }
  let count = parseInt(lastDoc[0].sku);
  count++;
  return count;
}

async function getCatCount(){
  let lastDoc = await Category.find().limit(1).sort({$natural:-1})
  if(lastDoc.length === 0){
    return 1;
  }
  let count = parseInt(lastDoc[0].sku);
  count++;
  return count;
}


module.exports = router;
