const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

// A throwaway hash so login takes similar time whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password }); // pre('save') hashes it
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  const ok = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

  // Same message for unknown email and wrong password.
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
