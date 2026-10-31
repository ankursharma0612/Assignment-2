const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const requireObjectBody = require('../middleware/requireObjectBody');
const tasks = require('../controllers/taskController');

const PRIORITIES = ['low', 'medium', 'high'];
const priorityMsg = `priority must be one of: ${PRIORITIES.join(', ')}`;
const dueDateMsg = 'dueDate must be a valid date, e.g. 2026-12-31';

// Title is required when creating, optional when updating.
const titleRule = (optional) => {
  const chain = body('title');
  if (optional) chain.optional();
  return chain
    .isString().withMessage('Title must be a non-empty string').bail()
    .trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters');
};

// These fields are optional on both create and update.
const optionalRules = [
  body('description').optional()
    .isString().withMessage('Description must be a string').bail()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  body('completed').optional()
    .isBoolean().withMessage('completed must be true or false')
    .toBoolean(),
  body('priority').optional()
    .isString().withMessage(priorityMsg).bail()
    .isIn(PRIORITIES).withMessage(priorityMsg),
  body('dueDate').optional()
    .isString().withMessage(dueDateMsg).bail()
    .isISO8601({ strict: true }).withMessage(dueDateMsg),
];

const idRule = param('id').isMongoId().withMessage('Invalid task id');

router.route('/')
  .get(tasks.getTasks)
  .post([titleRule(false), ...optionalRules], validate, tasks.createTask);

router.route('/:id')
  .all(idRule, validate)
  .get(tasks.getTask)
  .put(requireObjectBody, [titleRule(true), ...optionalRules], validate, tasks.updateTask)
  .delete(tasks.deleteTask);

module.exports = router;
