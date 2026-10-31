const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// Only these fields can be set from a request body (prevents overwriting _id, createdAt, etc.).
const FIELDS = ['title', 'description', 'completed', 'priority', 'dueDate'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const notFound = (res) => res.status(404).json({ message: 'Task not found' });

exports.createTask = asyncHandler(async (req, res) => {
  const task = await Task.create(pick(req.body));
  res.status(201).json(task);
});

exports.getTasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.completed === 'true') filter.completed = true;
  if (req.query.completed === 'false') filter.completed = false;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return notFound(res);
  res.json(task);
});

exports.updateTask = asyncHandler(async (req, res) => {
  const updates = pick(req.body);
  if (!Object.keys(updates).length) {
    return res
      .status(400)
      .json({ message: `Provide at least one field to update: ${FIELDS.join(', ')}` });
  }
  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!task) return notFound(res);
  res.json(task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return notFound(res);
  res.json({ message: 'Task deleted' });
});
