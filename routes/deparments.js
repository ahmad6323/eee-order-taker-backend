const express = require("express");
const router = express.Router();
const Department = require("../models/department");

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    var departments = name.split(",");
    let departmentsAdded = [];

    departments.map(async (department) => {
      // Check if department with the same name already exists
      let existingDepartment = await Department.findOne({
        name: department.trim(),
      });
      if (!existingDepartment) {
        // If not, save the new department
        let departmentAdd = new Department({
          name: department.trim(),
        });
        departmentAdd = await departmentAdd.save();
        departmentsAdded.push(departmentAdd);
      }
    });

    res.send(departmentsAdded);
  } catch (ex) {
    console.log(ex);
  }
});

// update department
router.put("/:id", async (req, res) => {
  try {
    const { department } = req.body;

    let find = await Department.findById(req.params.id);

    if (!find) {
      return res.status(400).send("Invalid Request to update size");
    }

    let existing = await Department.findOne({
      name: department,
    });

    if (existing) {
      return res.status(400).send("Invalid Request to update size");
    }

    const newDepartment = await Department.findByIdAndUpdate(
      find._id,
      {
        name: department,
      },
      { new: true }
    );

    res.send(newDepartment);
  } catch (ex) {
    console.log(ex);
  }
});

router.get("/", async (req, res) => {
  const departments = await Department.find();
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
