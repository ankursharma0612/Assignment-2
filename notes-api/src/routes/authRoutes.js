const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');

// Slows down brute-force attempts on register/login (per IP).
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again in a few minutes' },
  })
);

// isString() blocks object payloads like {"$gt": ""} (NoSQL operator injection).
const emailRule = body('email')
  .isString().withMessage('Valid email is required').bail()
  .trim().toLowerCase().isEmail().withMessage('Valid email is required');

router.post(
  '/register',
  [
    body('name').isString().withMessage('Name is required').bail()
      .trim().notEmpty().withMessage('Name is required'),
    emailRule,
    body('password').isString().withMessage('Password must be 6 to 72 characters').bail()
      .isLength({ min: 6, max: 72 }).withMessage('Password must be 6 to 72 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    emailRule,
    body('password').isString().withMessage('Password is required').bail()
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
