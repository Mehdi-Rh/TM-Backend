const Task = require("../models/taskModel");
const mongoose = require("mongoose");

// Get all tasks
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let sort = req.query.sort || "taskId";
    const sortBy = req.query.sortBy || "asc";

    let statusIds = req.query.status_ids || "All";
    let categoryIds = req.query.category_ids || "All";

    const categoryOptions = [
      { id: "work", label: "Work" },
      { id: "personal", label: "Personal" },
      { id: "shopping", label: "Shopping" },
      { id: "home", label: "Home" },
      { id: "other", label: "Other" },
    ];

    const statusOptions = [
      { id: "todo", label: "To Do" },
      { id: "inprogress", label: "In Progress" },
      { id: "completed", label: "Completed" },
    ];

    const getCategory = (categoryIds) => {
      if (categoryIds === "All") {
        return categoryOptions.map((category) => category.label);
      } else {
        const categories = categoryIds.split(",").map((id) => {
          return categoryOptions.find((category) => category.id === id).label;
        });
      }
    };

    const getStatus = (statusIds) => {
      if (statusIds === "All") {
        return statusOptions.map((status) => status.label);
      } else {
        const statuses = statusIds.split(",").map((id) => {
          return statusOptions.find((status) => status.id === id).label;
        });
      }
    };

    const user_id = req.user._id;
    const tasks = await Task.find({
      userId: user_id,
      title: { $regex: search, $options: "i" },
    })
      // .where("category")
      // .in(getCategory(categoryIds))
      // .where("status")
      // .in(getStatus(statusIds))
      .sort({ [sort]: sortBy })
      .skip(page * limit)
      .limit(limit);

    const total = await Task.countDocuments({
      // category: { $in: [...getCategory(categoryIds)] },
      // status: { $in: [...getStatus(statusIds)] },
      userId: user_id,
      title: { $regex: search, $options: "i" },
    });

    const response = {
      error: null,
      total,
      page: page + 1,
      limit,
      tasks,
      categories: categoryOptions,
      statuses: statusOptions,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" + err });
  }
};

// Get a single task
const getTask = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("No such task found");
  }
  const task = await Task.findById(id);

  if (!task) {
    return res.status(404).send("No such task found");
  }
  res.status(200).json(task);
};

// Create new task
const createTask = async (req, res) => {
  const { title, description, category, dueDate, status } = req.body;

  let emptyFields = [];

  if (!title) {
    emptyFields.push("title");
  }
  if (!description) {
    emptyFields.push("description");
  }
  if (!category) {
    emptyFields.push("category");
  }
  if (!dueDate) {
    emptyFields.push("dueDate");
  }
  if (!status) {
    emptyFields.push("status");
  }
  if (emptyFields.length > 0) {
    return res
      .status(400)
      .json({ error: "Please fill in all fields", emptyFields });
  }

  // add to the database
  try {
    const userId = req.user._id;
    const userLastTaskIdNbr = req.user.lastTaskIdNbr;
    console.log({ name: req.user });
    const taskIdPrefix = req.user.name
      .split(" ")
      .map((word) => word[0])
      .join("");
    const task = await Task.create({
      taskId: taskIdPrefix + "-" + userLastTaskIdNbr,
      title,
      description,
      category,
      dueDate,
      status,
      userId,
    });
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { ...req.user, lastTaskIdNbr: lastTaskIdNbr + 1 }
    );
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("No such task found");
  }

  const task = await Task.findOneAndDelete({ _id: id });

  if (!task) {
    return res.status(404).send("No such task found");
  }

  res.status(200).json(task);
};

// update a task
const updateTask = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("No such task found");
  }

  const task = await Task.findOneAndUpdate(
    { _id: id },
    {
      ...req.body,
    }
  );

  res.status(200).json(task);
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  deleteTask,
  updateTask,
};
