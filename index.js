const express = require("express");
const app = express();

require("./initialize/routes")(app);
require("./initialize/db")();

const port = process.env.PORT || 3500;
let server = app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);

module.exports = server;
