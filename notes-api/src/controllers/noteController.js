const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notFound = (res) => res.status(404).json({ message: 'Note not found' });

// Every query includes `user: req.user.id`, so users can only reach their own notes.

exports.createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ title, content, user: req.user.id });
  res.status(201).json(note);
});

exports.getNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q } = req.query;
  const filter = { user: req.user.id };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { content: rx }];
  }
  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Note.countDocuments(filter),
  ]);
  res.json({ page, limit, total, pages: Math.ceil(total / limit), notes });
});

exports.getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
  if (!note) return notFound(res);
  res.json(note);
});

exports.updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'Provide title and/or content to update' });
  }
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!note) return notFound(res);
  res.json(note);
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!note) return notFound(res);
  res.json({ message: 'Note deleted' });
});
