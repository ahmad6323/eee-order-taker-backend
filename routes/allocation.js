const express = require("express");
const router = express.Router();
const ProductAllocation = require("../models/allocation");
const Product = require("../models/product");
const Salesman = require("../models/salesman");
const ProductVariation = require("../models/productVariation");

// Create a new product allocation
router.post("/", async (req, res) => {
  try {

    const { salesmanId, allocations } = req.body;

    // ensure salesman is valid
    const salesman = await Salesman.findById(salesmanId.value);
    if (!salesman) {
      return res.status(404).send("Salesman not found");
    }
      
    // ensure all variations are valid 
    const variationIds = allocations.map((alloc)=>{
      return alloc.productId.length > 0 && alloc.productId;
    }); 

    const variations = await ProductVariation.find({
      _id: {
        $in: variationIds
      }
    });

    if(variations.length !== allocations.length){
      return res.status(400).send("Problems in product variations");
    }
    
    const productsList = allocations.map((alloc)=>{
      return {
        variation: alloc.productId,
        quantity: alloc.quantity
      }
    });

    // assign
    let assignedAllocations = new ProductAllocation({
      salesmanId: salesmanId.value,
      products: productsList
    });

    assignedAllocations = await assignedAllocations.save();

    res.status(201).send(assignedAllocations);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Get all product allocations for salesman
router.get("/:id", async (req, res) => {
  try {
    const allocations = await ProductAllocation.findOne({
      salesmanId: req.params.id
    })
      .populate({
        path: 'products.variation',
        populate: [
          {
            path: 'productId',
            model: 'Product',
            select: "name price description imageUrl"
          },
          {
            path: "size",
            model: "Size",
            select: "size"
          },
          {
            path: "color",
            model: "Color",
            select: "color"
          }
        ],
      }).populate({
        path: "salesmanId",
        model: "Salesman",
        select: "name phone email"
      }
    );

    // Assuming `allocations.products` contains the list of products
    const groupedProducts = groupProductsByProductId(allocations.products);
    
    // If you need it in an array format instead of an object
    const groupedProductsArray = Object.values(groupedProducts);
    res.send(groupedProductsArray);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// utility
const groupProductsByProductId = (products) => {
  return products.reduce((acc, product) => {
    const productId = product.variation.productId._id.toString();
    if (!acc[productId]) {
      acc[productId] = {
        productDetails: product.variation.productId,
        variations: []
      };
    }
    acc[productId].variations.push({
      _id: product.variation._id,
      size: product.variation.size,
      color: product.variation.color
    });
    return acc;
  }, {});
};

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

// get all variations for the salesman
router.get("/variations/:id", async (req, res) => {
  try {

    const saleMan = await Salesman.findById(req.params.id);

    if(!saleMan){
      return res.status(404).send("Invalid salesman ID");
    }
    
    const departmentsId = saleMan.department.map(dep => dep.toHexString());

    // find products that belong to departments
    const productsList = await Product.find({
      department: {
        $in: departmentsId
      }
    }).select("_id");


    const variations = await ProductVariation.find({
      productId: {
        $in: productsList
      }
    }).populate({
      path: 'productId',
      select: 'name price'
    }).populate({
      path: "size",
      select: "size"
    })
    .populate({
      path: "color",
      select: "color"
    });

    res.send(variations);

  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
