const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Limits brute-force attempts on register/login.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

// bcrypt only uses the first 72 BYTES, so reject anything longer.
const passwordRules = body('password')
  .isString().withMessage('Password must be a string').bail()
  .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters').bail()
  .custom((v) => Buffer.byteLength(v, 'utf8') <= 72).withMessage('Password is too long (max 72 bytes)');

// isString() blocks NoSQL operator injection like {"email": {"$gt": ""}}.
const emailRules = body('email')
  .isString().withMessage('Email must be a string').bail()
  .trim()
  .isEmail().withMessage('Invalid email format');

const registerRules = [
  body('name')
    .isString().withMessage('Name must be a string').bail()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Name is required (max 50 characters)'),
  emailRules,
  passwordRules,
  validate,
];

const loginRules = [
  emailRules,
  body('password')
    .isString().withMessage('Password must be a string').bail()
    .notEmpty().withMessage('Password is required'),
  validate,
];

router.post('/register', authLimiter, registerRules, register);
router.post('/login', authLimiter, loginRules, login);
router.get('/me', auth, me);

module.exports = router;
