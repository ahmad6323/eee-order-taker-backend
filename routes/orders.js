const express = require("express");
const router = express.Router();
const Order = require('../models/order');
const Product = require("../models/product");

// POST endpoint to create a new order
router.post("/", async (req, res) => {
  try {
    
    const { items, latitude, longitude } = req.body;

    if (!items || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let totalPrice = 0;
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
        totalPrice += item.pricePerUnit * variation.quantity;
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
    const orders = await Order.find();

    let totalBill = 0;

    const processedOrders = orders.map((order) => {
      const processedOrder = {
        salesmanName: order.items[0].salesman,
        products: [],
        location: {
          latitude: order.location.coordinates[0],
          longitude: order.location.coordinates[1]
        },
        totalBill: 0
      };

      for (const item of order.items) {
        const product = item.productId; 

        const variations = item.variations.map((variation) => ({
          sku: variation.sku,
          quantity: variation.quantity,
        }));

        const totalPrice = item.pricePerUnit * variations.reduce((acc, variation) => acc + variation.quantity, 0);
        totalBill += parseInt(totalPrice);

        processedOrder.totalBill = totalBill;
        processedOrder.products.push({  
          name: product.name,
          imageUrl: product.imageUrl,
          variations,
          totalPrice: totalPrice.toFixed(2),
        });
      }
      return processedOrder;
    });
    
    res.send(processedOrders);
  } catch (err) {
    console.error('Error processing orders:', err);
  }
});


module.exports = router;
