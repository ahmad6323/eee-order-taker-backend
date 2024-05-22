const express = require("express");
const router = express.Router();
const ProductAllocation = require("../models/allocation");
const Product = require("../models/product");
const Salesman = require("../models/salesman");
const ProductVariation = require("../models/productVariation");
const c = require("config");

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

// get all allocations for admin
router.get("/", async (req, res) => {
  try {
    const allocations = await ProductAllocation.find()
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

    const dataFormatted = transformData(allocations);

    res.send(dataFormatted);

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// Get all product allocations for salesman - salesman product list page
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

    if(allocations && allocations.products){
      const groupedProducts = groupProductsByProductId(allocations.products);
      const groupedProductsArray = Object.values(groupedProducts);
      res.send(groupedProductsArray);
    }

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// Get product allocations for salesman - salesman product detail page
router.get("/get_allocations/:id/:userId", async (req, res) => {
  try {
    const allocations = await ProductAllocation.findOne({
      salesmanId: req.params.userId,
    })
      .populate({
        path: 'products.variation',
        match: {
          productId: req.params.id
        },
        select: "color size SKU",
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
      }
    );

    const processed = post_process(allocations);
    res.send(processed);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});



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

// get all variations for the salesman - get variations by salesman id to assign to a salesman
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


// utility
// post-process the data for better visualization
const post_process = (data) => {
  let name = "";
  let imageUrl = [];
  let description = "";
  let productId = "";
  let price = 0;

  const variations = data.products.map((product) => {
    if (product.variation) {
      name = product.variation.productId.name;
      imageUrl = product.variation.productId.imageUrl;
      description = product.variation.productId.description;
      productId = product.variation.productId._id.toHexString()
      price = product.variation.productId.price;
      return {
        variationId: product.variation._id,
        price: product.variation.productId.price,
        color: product.variation.color,
        size: product.variation.size,
        quantity: product.quantity,
        sku: product.variation.SKU,
      };
    } else {
      return null; 
    }
  }).filter(variation => variation !== null);
  
  const product = {
    productId,
    name,
    imageUrl,
    description,
    price,
    variations,
  };

  return product;
};

// take all allocations, group them by product
function groupProductsByProductIds(data) {
  const groupedProducts = {};

  for (const order of data) {
    for (const product of order.products) {
      const productId = product.variation.productId._id.toString();

      if (!groupedProducts[productId]) {
        groupedProducts[productId] = {
          productId: product.variation.productId,
          variations: [],
        };
      }

      groupedProducts[productId].variations.push({
        ...product.variation,
        quantity: product.quantity,
      });
    }
  }

  return groupedProducts;
}


// group all variations based on *shared* productId
const groupProductsByProductId = (products) => {
  return products.reduce((acc, product) => {
    const productId = product.variation.productId._id.toString();
    if (!acc[productId]) {
      acc[productId] = {
        productDetails: product.variation.productId,
        variations: [],
      };
    }
    acc[productId].variations.push({
      _id: product.variation._id,
      size: product.variation.size,
      color: product.variation.color,
      quantity: product.quantity,
      sku: product.variation.SKU
    });
    return acc;
  }, {});
};

function transformData(data) {
  const transformedData = [];
  for (const order of data) {
    const salesman = order.salesmanId;
    const products = {};
    for (const product of order.products) {
      const variation = product.variation;
      const productId = variation.productId._id;
      if (!products[productId]) {
        products[productId] = {
          productId: variation.productId._id.toHexString(),
          name: variation.productId.name,
          imageUrl: variation.productId.imageUrl,
          price: variation.productId.price,
          description: variation.productId.description,
          variations: [],
        };
      }
      products[productId].variations.push({
        _id: variation._id.toHexString(),
        color: variation.color.color,
        size: variation.size.size,
        SKU: variation.SKU,
        quantity: product.quantity,
      });
    }
    transformedData.push({
      _id: order._id,
      salesmanId: salesman,
      products: Object.values(products),
    });
  }
  return transformedData;
}

module.exports = router;
