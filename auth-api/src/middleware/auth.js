const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Verifies "Authorization: Bearer <token>" and sets req.user.
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authenticated: token missing' });
  }

  // Throws JsonWebTokenError / TokenExpiredError, handled in errorHandler.
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });

  req.user = user;
  next();
});
