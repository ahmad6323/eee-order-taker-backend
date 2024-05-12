const express = require("express");
const router = express.Router();
const { Department, validate } = require("../models/department");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { name } = req.body;

  // Check if department with the same name already exists
  let existingDepartment = await Department.findOne({ name: name });
  if (existingDepartment) {
    return res.status(400).send("Department with this name already exists.");
  }

  // If not, save the new department
  let department = new Department({
    name: name,
  });

  department = await department.save();
  res.send(department);
});

router.get("/", async (req, res) => {
  const departments = await Department.find().sort("name");
  res.send(departments);
});

router.delete("/:id", async (req, res) => {
  const department = await Department.findByIdAndRemove(req.params.id);
  if (!department)
    return res
      .status(404)
      .send("The department with the given ID was not found.");

  res.send(department);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { name } = req.body;

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { name: name },
    {
      new: true,
    }
  );
  if (!department)
    return res
      .status(404)
      .send("The department with the given ID was not found.");

  res.send(department);
});

module.exports = router;
