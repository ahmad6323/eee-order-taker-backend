const express = require("express");
const app = express();
var cors = require('cors');
const bodyParser = require('body-parser');

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json());

require("./initialize/routes")(app);
require("./initialize/db")();

app.use('/public',express.static('public'));

const port = process.env.PORT || 3500;
let server = app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);

module.exports = server;
