const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { Category } = require("../models/category");
const { Department } = require("../models/department");
const ProductVariation = require("../models/productVariation");
const multer = require('multer');
const upload = multer({dest: "./public/products/"});
const Color = require("../models/colors");
const Size = require("../models/size");
const SubCategory = require("../models/subCategory");

// CREATE
router.post("/",  upload.array('images'), async (req, res) => {
  try {

    const { name, category, department, price, colors, sizes, description } = req.body;

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
      department: foundDeparts
    });
    
    // update images
    if(req.files && req.files.length > 0){
      const filePaths = req.files.map(file => file.path);
      // Join file paths into a single comma-separated string
      const filePathsString = filePaths.join(',');
      console.log(filePathsString);  
      product.imageUrl = filePathsString;
    }
    
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
    
    res.send(product);
  } catch (err) {
    console.error(err.message);
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


async function generateSKU() {
  try{
    // get count of variations
    return await ProductVariation.countDocuments({});
  }catch(ex){
    console.error(err.message);
    return 0;
  }
}


module.exports = router;
