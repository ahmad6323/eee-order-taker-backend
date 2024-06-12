const express = require("express");
const router = express.Router();
const ProductAllocation = require("../models/allocation");
const Product = require("../models/product");
const Salesman = require("../models/salesman");
const ProductVariation = require("../models/productVariation");
const mongoose = require("mongoose");

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
      return alloc.variation.length > 0 && alloc.variation;
    }); 

    const variations = await ProductVariation.find({
      _id: {
        $in: variationIds
      }
    });

    if(variations.length !== allocations.length){
      return res.status(400).send("Problems in product variations");
    }
    
    const grouped = formatAllocationsIntoGroups(allocations);
    
    // iterate over the grouped
    await updateAllocations(salesmanId["value"],grouped);
    
    res.send("Complete");
    
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
    const allocations = await ProductAllocation.find({
      salesmanId: req.params.id
    })
      .populate({
        path: 'products.variation',
        populate: [
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
        path: "productId",
        model: "Product",
        select: "name imageUrl price description"
      }
    );

    res.send(allocations);

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// Get product allocations for salesman - salesman product detail page
router.get("/get_allocations/:id", async (req, res) => {
  try {
    const allocations = await ProductAllocation.findById(req.params.id)
      .populate({
        path: 'products.variation',
        select: "color size SKU",
        populate: [
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
    ).populate({
      path: "productId",
      model: "Product",
      select: "name price imageUrl description"
    });

    res.send(allocations);
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
    let productAllocation = await ProductAllocation.findById(req.params.id);
    
    if (!productAllocation) {
      return res.status(404).send("Product allocation not found");
    }

    productAllocation = await ProductAllocation.findByIdAndDelete(productAllocation._id);

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
        remaining: product.remaining,
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
      remaining: product.remaining,
      sku: product.variation.SKU
    });
    return acc;
  }, {});
};

function transformData(data) {
  const transformedData = [];
  for (const order of data) {
    if(!order.salesmanId){
      return;
    }
    const salesman = order.salesmanId;
    const products = {};
    for (const product of order.products) {

      const variation = product.variation;

      if(!variation){
        return;
      }

      if(!variation.productId){
        return;
      }

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
        remaining: product.remaining
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

function formatAllocations(allocations){
  
  return allocations.map(allocation => {
    const productMap = {};

    allocation.products.forEach(product => {
      const variation = product.variation;
      const productId = variation.productId._id;
      
      if (!productMap[productId]) {
        productMap[productId] = {
          productDetails: {
            _id: variation.productId._id,
            name: variation.productId.name,
            price: variation.productId.price,
            imageUrl: variation.productId.imageUrl,
            description: variation.productId.description,
          },
          variations: []
        };
      }

      productMap[productId].variations.push({
        _id: variation._id,
        size: variation.size,
        color: variation.color,
        quantity: product.quantity,
        remaining: product.remaining,
        sku: variation.sku,
      });
    });

    return Object.values(productMap);
  }).flat();
}

// group the allocations based on product ID
function formatAllocationsIntoGroups(allocations){

  const grouped = allocations.reduce((acc, curr) => {
    const { productId, quantity, variation } = curr;
  
    if (!acc[productId]) {
      acc[productId] = [];
    }
  
    acc[productId].push({
      variation,
      quantity: parseInt(quantity, 10)
    });
  
    return acc;
  }, {});
  
  // Transforming the grouped object into the desired format
  return Object.entries(grouped).map(([productId, variations]) => ({
    productId,
    variations
  }));

}

async function updateAllocations(salesmanId, data) {
  try{
    for (const product of data) {
      const { productId, variations } = product;
  
      // Find the product allocation document
      let allocation = await ProductAllocation.findOne({
        salesmanId: salesmanId,
        productId: productId
      });
  
      if (!allocation) {
        // If allocation doesn't exist, create a new one
        allocation = new ProductAllocation({
          salesmanId: salesmanId,
          productId: productId,
          products: []
        });
      }
  
      for (const variation of variations) {
        const { variation: variationId, quantity } = variation;
  
        // Find the existing variation in the products array
        const existingVariation = allocation.products.find(
          (v) => v.variation.toString() === variationId
        );
  
        if (existingVariation) {
          // Update quantity and remaining if variation exists
          existingVariation.quantity += quantity;
          existingVariation.remaining += quantity;
        } else {
          // Add new variation if it doesn't exist
          allocation.products.push({
            variation: new mongoose.Types.ObjectId(variationId),
            quantity,
            remaining: quantity
          });
        }
      }
  
      // Save the updated allocation document
      await allocation.save();
    }
  }catch(ex){
    console.log(ex);
  }
}

module.exports = router;
