const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderVariation = new Schema({
  maxQuantity: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  variationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariation",
  },
});

const itemSchema = new Schema({
  salesman: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  variations: [orderVariation],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  departmentName: [
    {
      type: String,
    }
  ],
  categoryName: {
    type: String,
  },
});

const orderSchema = new Schema({
  items: [itemSchema],
  totalPrice: {
    type: Number,
  },
  totalQuantity: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  feedBack: {
    type: String,
  },
  creation_time: {
    type: Date,
    default: Date.now()
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    }
  },
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;