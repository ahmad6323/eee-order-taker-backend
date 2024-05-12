const express = require("express");
const error = require("../middleware/error");
const salesmans = require("../routes/salesmans");
const products = require("../routes/products");
const allocation = require("../routes/allocation");
const department = require("../routes/deparments");
const categories = require("../routes/categories");
const salesmanAuth = require("../routes/salesmanAuth");
const admins = require("../routes/admins");
const adminAuth = require("../routes/adminAuth");
const orders = require("../routes/orders");
const sizes = require("../routes/sizes");
const colors = require("../routes/colors");

module.exports = function (app) {
  app.use(express.json());
  app.use("/api/salesmans", salesmans);
  app.use("/api/products", products);
  app.use("/api/allocation", allocation);
  app.use("/api/departments", department);
  app.use("/api/categories", categories);
  app.use("/api/auth", salesmanAuth);
  app.use("/api/admins", admins);
  app.use("/api/adminAuth", adminAuth);
  app.use("/api/orders", orders);
  app.use("/api/sizes", sizes);
  app.use("/api/colors", colors);
  app.use(error);
};
