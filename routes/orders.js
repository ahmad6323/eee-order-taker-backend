const express = require("express");
const router = express.Router();
const Order = require('../models/order');
const Product = require("../models/product");
const Salesman = require("../models/salesman");
const Customer = require("../models/customer");
const ProductAllocation = require("../models/allocation");

// POST endpoint to create a new order
router.post("/", async (req, res) => {
  try {
    
    const { items, latitude, longitude, totalPrice, customerData } = req.body;

    if (!items || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let totalQuantity = 0;

    const enrichedItems = await Promise.all(items.map(async item => {
      const getProduct = await Product.findById(item.productId).populate(
        [
          {
            path: 'category',
            model: 'SubCategory'
          }, 
          {
            path: 'department',
            model: 'Department'
          }
        ]
      );

      item.departmentName = getProduct ? getProduct.department.map(dep => dep.name) : null;
      item.categoryName = getProduct && getProduct.category ? getProduct.category.name : null;
      
      item.variations.forEach(variation => {
        totalQuantity += variation.quantity;
      });

      return item;
    }));

    const orderData = {
      items: enrichedItems,
      totalPrice,
      totalQuantity,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    };

    let newOrder = new Order(orderData);
    newOrder = await newOrder.save();

    // customer
    let customer = new Customer({
      ...customerData,
      order: newOrder._id
    });

    customer = await customer.save();

    newOrder = await Order.findByIdAndUpdate(
      newOrder._id,
      {
        customer: customer._id
      },
      {
        new: true
      }
    );

    // update the salesman'S allocation
    items.map(async (item)=>{
      
      const { salesman, variations } = item;

      // take variations
      for (const variation of variations) {
        const { variationId, quantity } = variation;
  
        // Find the allocation document
        const allocation = await ProductAllocation.findOne({
          salesmanId: salesman,
          'products.variation': variationId
        });
        if (allocation) {
          const product = allocation.products.find(p => p.variation.toString() === variationId);
          if (product) {
            // Update the remaining quantity
            const remaining = product.remaining - quantity;
  
            // Save the updated allocation document
            await ProductAllocation.updateOne(
              { _id: allocation._id, "products.variation": variationId },
              { $set: { "products.$.remaining": remaining } }
            );
          }
        }
      }
    });
    
    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error("Error creating orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET endpoint to retrieve all orders
router.get("/", async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find().populate("customer");

    const processedOrders = orders.map(async (order) => {

      let salesman = await Salesman.findById(order.items[0].salesman).select("_id name image phone"); 
      
      const processedOrder = {
        salesmanId: salesman._id,
        salesmanName: salesman.name,
        image: salesman.image,
        phone: salesman.phone,
        feedBack: order.feedBack,
        customer: order.customer ? order.customer : undefined,
        products: [],
        location: {
          latitude: order.location.coordinates[0],
          longitude: order.location.coordinates[1]
        },
        totalBill: order.totalPrice
      };

      for (const item of order.items) {
        const product = item.productId; 

        // get the product using productId
        const findProductById = await Product.findById(product);

        if(!findProductById){
          return;
        }
        
        let quantityOrdered = 0;

        const variations = item.variations.map((variation) => {
          quantityOrdered = quantityOrdered + variation.quantity;
          return {
            sku: variation.sku,
            quantity: variation.quantity,
          }
        });

        processedOrder.products.push({  
          name: findProductById.name,
          imageUrl: findProductById.imageUrl,
          price: findProductById.price,
          variations,
          quantityOrdered
        });
      }
      return processedOrder;
    });

    Promise.all(processedOrders)
      .then((data) => {
        if(data && data.length > 0){
          data = data.filter(d => d !== null && d !== undefined);
        }
        res.send(data);
      })
      .catch((error) => {
        // Handle the error appropriately
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing orders' });
      }
    );
    
  } catch (err) {
    console.error('Error processing orders:', err);
  }
});

// GET endpoint to retrieve dashboard content - count sales etc
router.get("/profile_screen", async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find();

    let totalSales = calculateTotalBill(orders);

    const totalProducts = await Product.countDocuments({});
    const totalSalesman = await Salesman.countDocuments({});

    const data = {
      totalSales: formatPrice(totalSales),
      orders: orders.length,
      totalProducts,
      totalSalesman
    };

    res.send(data);

  } catch (err) {
    console.error('Error processing orders:', err);
  }
});


// get salesman's order by salesman's id
router.get("/salesman_orders/:id", async (req, res) => {
  try {
    const orders = await Order.find({ 'items.salesman': req.params.id });
    return res.send(orders);
  } catch (err) {
    console.error('Error processing orders:', err);
  }
});


// format price
const formatPrice = (price)=>{
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'PKR',
  })
}

// calculate total sales - admin
function calculateTotalBill(data) {
  let totalSales = 0;
  data.map((item)=>{
    totalSales = totalSales + getPriceFromString(item.totalPrice);
  });
  return totalSales
}

// convert string price to int
const getPriceFromString = (priceString)=>{
  return parseInt(priceString.replace(/[^0-9.-]+/g, ''), 10);
}

module.exports = router;
