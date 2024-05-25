const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { Category } = require("../models/category");
const Department = require("../models/department");
const ProductVariation = require("../models/productVariation");
const multer = require('multer');
const upload = multer({dest: "./public/products/"});
const Color = require("../models/colors");
const Size = require("../models/size");
const SubCategory = require('../models/subcategory');
const fs = require('fs');
const path = require('path');

// CREATE
router.post("/", upload.any('imageUrl',12), async (req, res) => {
  try {
    
    const { imageUrl, name, category, department, price, colors, sizes, description } = req.body;

    // Array to store the paths of the saved images
    const imagePaths = [];

    if(imageUrl && imageUrl.length > 0){
      imageUrl.forEach((base64, index) => {
        const buffer = Buffer.from(base64, 'base64');
        const timestamp = new Date().getTime();
        const imageName = `${name}_${timestamp}_product_image${index}.png`;
        const imagePath = path.join(__dirname, '../public/products', imageName);
  
        fs.writeFile(imagePath, buffer, err => {
          if (err) {
            console.error('Error saving the image:', err);
          }
          // Add the image path to the array
          imagePaths.push(imageName);
        });
      });
    }

    const existingSubCat = await SubCategory.findById(category).populate("parent_id");
    if (!existingSubCat){
      return res.status(400).send("Sub-Category not found")
    };

    const foundDeparts = await Department.find({
      _id: { $in: department }
    }).select('_id');

    if(foundDeparts.length !== department.length){
      return res.status(400).send("Department not found");
    }

    // create product
    let product = new Product({
      name,
      price,
      description,
      department: foundDeparts,
      imageUrl: imagePaths
    });

    // save product
    product = await product.save();
    
    // create variations
    const productVariationIds = []; 
    let SKU = await generateSKU();

    // take colors and split it

    for (const color of colors) {

      const findColor = await Color.findById(color);

      if(!findColor){
        return;
      }
      
      for (const size of sizes) {

        const findSize = await Size.findById(size);
  
        if(!findSize){
          return;
        }
        const variation = new ProductVariation({
          productId: product._id,
          color: findColor._id,
          size: findSize._id,
          SKU: `${existingSubCat.parent_id.sku}-${existingSubCat.sku}-${SKU.toString().padStart(5, '0')}`
        });

        SKU = producSKU(SKU);
        
        const savedVariation = await variation.save(); 
        productVariationIds.push(savedVariation._id);
      }
    }

    // Update the product with the generated variation IDs
    product = await Product.findByIdAndUpdate(product._id, { $push: { variations: { $each: productVariationIds } } }, { new: true });
    
    res.status(200).send("Successfull");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

function producSKU(sku){
  return sku + 1;
}

// READ (Get all products)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort("name").populate({
      path: 'variations',
      populate: [
        { path: 'color' }, 
        { path: 'size' }
      ]
    });
    res.send(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// READ (Get a single product by ID)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .send("The product with the given ID was not found.");
    res.send(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// READ (Get products by department)
router.get("/department/:departmentId", async (req, res) => {
  try {
    const products = await Product.find({
      department: req.params.departmentId,
    });
    res.send(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, category, department, price, colors, imageUrl, description } =
      req.body;

    const existingCategory = await Category.findById(category);

    if (!existingCategory) return res.status(400).send("Invalid category.");

    let product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        department,
        price,
        colors,
        imageUrl,
        description,
      },
      { new: true }
    );

    if (!product)
      return res
        .status(404)
        .send("The product with the given ID was not found.");

    res.send(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndRemove(req.params.id);
    if (!product)
      return res
        .status(404)
        .send("The product with the given ID was not found.");
    res.send(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

async function generateSKU() {
  try{
    let lastDoc = await ProductVariation.find().limit(1).sort({$natural:-1})
    if(lastDoc.length === 0){
      return 1;
    }
    const sku = lastDoc[0].SKU.split("-");
    let count = parseInt(sku[2]);
    count++;
    return count;
  }catch(ex){
    console.error(err.message);
    return 0;
  }
}


module.exports = router;
