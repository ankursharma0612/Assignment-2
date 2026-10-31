exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });

  if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }

  console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
};
