const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation Errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Authentication validation
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Content generation validation
const validateContentGeneration = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('type')
    .isIn(['image', 'video'])
    .withMessage('Type must be either "image" or "video"'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters')
    .escape(),
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  handleValidationErrors
];

// Content ID validation
const validateContentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid content ID'),
  handleValidationErrors
];

// Subscription validation
const validateSubscription = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('paymentMethod')
    .isIn(['Visa', 'MasterCard', 'PayPal'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Feedback validation
const validateFeedback = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
    .escape(),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateContentGeneration,
  validateUserId,
  validateContentId,
  validateSubscription,
  validateFeedback,
  handleValidationErrors
};