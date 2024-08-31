const express = require("express");
const router = express.Router();

const {
  createTask,
  getTask,
  getTasks,
  deleteTask,
  updateTask,
} = require("../controllers/taskController");

const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

// Get all tasks
router.get("/", getTasks);

// Get a specific task
router.get("/:id", getTask);

// POST a new task
router.post("/", createTask);

// Delete a task
router.delete("/:id", deleteTask);

// Update a task
router.patch("/:id", updateTask);

module.exports = router;
