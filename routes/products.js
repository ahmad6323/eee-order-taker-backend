const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { Category } = require("../models/category");
const { Department } = require("../models/department");
const ProductVariation = require("../models/productVariation");
const multer = require('multer');
const upload = multer({dest: "./public/products/"});

// CREATE
router.post("/",  upload.array('images'), async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, category, department, price, colors, sizes, description } = req.body;

    const existingCategory = await Category.findById(category);
    const existingDepartment = await Department.findById(department);

    if (!existingCategory) return res.status(400).send("Category not found");
    if (!existingDepartment){
      return res.status(400).send("Department not found");
    }

    // create product
    let product = new Product({
      name,
      category,
      department,
      price,
      colors,
      description,
    });
    
    // update images
    if(req.files.length > 0){
      const filePaths = req.files.map(file => file.path);
      // Join file paths into a single comma-separated string
      const filePathsString = filePaths.join(',');
      console.log(filePathsString);  
      product.imageUrl = filePathsString;
    }
    
    // save product
    product = await product.save();
    
    // create variations
    const productVariations = [];
    const productVariationIds = []; 
    for (const color of colors) {
        for (const size of sizes) {
          const SKU = generateSKU(product._id, color, size);
          const variation = new ProductVariation({
              productId: product._id,
              color: color,
              size: size,
              SKU: SKU
          });
          const savedVariation = await variation.save(); 
          productVariations.push(savedVariation);
          productVariationIds.push(savedVariation._id);
        }
    }

    // save all variations
    await ProductVariation.insertMany(productVariations);

    // Update the product with the generated variation IDs
    product = await Product.findByIdAndUpdate(product._id, { $push: { variations: { $each: productVariationIds } } }, { new: true });

    res.send(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// READ (Get all products)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort("name");
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
    const existingDepartment = await Department.findById(department);

    if (!existingCategory) return res.status(400).send("Invalid category.");
    if (!existingDepartment) return res.status(400).send("Invalid department.");

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



async function generateSKU(productId, color, size) {
  try{
    // get count of variations, 
    // if count is 0 -> return "00001"
    // else return the number's string based on 00000

    const countsVariants = await ProductVariation.countDocuments({});

    if(countsVariants > 0){
      
    }
    
    return "00001";
  }catch(ex){
    console.error(err.message);
    return "00001";
  }
}


module.exports = router;
