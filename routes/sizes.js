const express = require("express");
const router = express.Router();
const Size = require("../models/size");

// POST operation to create a new size
router.post("/", async (req, res) => {
  const { size } = req.body;

  var sizes = size.split(",");
  let sizesAdded = [];

  sizes.map(async (size) => {
    let existingSize = await Size.findOne({ size: size });
    if (existingSize) {
      return res.status(400).send("Size with this value already exists.");
    }
    
    let newSize = new Size({
      size: size,
    });
    
    newSize = await newSize.save();
    sizesAdded.push(newSize);
  })

  res.send(sizesAdded);
});

// update size
router.put("/:id", async (req, res) => {
  try{

    const { size } = req.body;
    console.log(req.body);

    let findSize = await Size.findById(req.params.id);

    if (!findSize) {
      return res.status(400).send("Invalid Request to update size");
    }

    let existingSize = await Size.findOne({
      size: size
    });

    if (existingSize) {
      return res.status(400).send("Invalid Request to update size");
    }
    
    const newSize = await Size.findByIdAndUpdate(findSize._id,{
      size: size
    }, { new : true });

    res.send(newSize);
  }catch(ex){
    console.log(ex);
  }
});


// GET operation to retrieve all sizes
router.get("/", async (req, res) => {
  const sizes = await Size.find().sort("size");
  res.send(sizes);
});

// DELETE operation to remove a size by ID
router.delete("/:id", async (req, res) => {
  const size = await Size.findByIdAndRemove(req.params.id);
  if (!size)
    return res.status(404).send("The size with the given ID was not found.");

  res.send(size);
});

module.exports = router;
