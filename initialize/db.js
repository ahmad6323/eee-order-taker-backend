const mongoose = require("mongoose");
const config = require("config");
const options = {
  family: 4,
};

module.exports = function () {
  const db = config.get("db");
  mongoose
    .connect(db, options)
    .then(() => console.log(`connected to ${db}...`))
    .catch((err) => console.log("could not connect to db", err.message));
};
