const router = require('express').Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const requireObjectBody = require('../middleware/requireObjectBody');
const notes = require('../controllers/noteController');

const titleRule = (optional) => {
  const chain = body('title');
  if (optional) chain.optional();
  return chain
    .isString().withMessage('Title must be a non-empty string').bail()
    .trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 120 }).withMessage('Title must be at most 120 characters');
};

const contentRule = body('content')
  .optional()
  .isString().withMessage('Content must be a string')
  .isLength({ max: 10000 }).withMessage('Content must be at most 10000 characters');

const idRule = param('id').isMongoId().withMessage('Invalid note id');

const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
  query('q').optional()
    .isString().withMessage('q must be a string')
    .isLength({ max: 100 }).withMessage('q must be at most 100 characters')
    .trim(),
];

router.use(auth); // every notes route requires a valid JWT

router.route('/')
  .get(listRules, validate, notes.getNotes)
  .post([titleRule(false), contentRule], validate, notes.createNote);

router.route('/:id')
  .all(idRule, validate)
  .get(notes.getNote)
  .put(requireObjectBody, [titleRule(true), contentRule], validate, notes.updateNote)
  .delete(notes.deleteNote);

module.exports = router;
