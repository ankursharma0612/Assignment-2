// Reject JSON primitives and arrays before route validators/controllers access fields.
module.exports = (req, res, next) => {
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object' });
  }
  next();
};
