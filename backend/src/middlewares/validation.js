// Input validation middleware
const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

// Register validation rules
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

// Login validation rules
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

// Content generation validation rules
const validateContentGeneration = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('type')
    .isIn(['image', 'video'])
    .withMessage('Type must be either "image" or "video"'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters')
    .escape(), // Sanitize HTML
  handleValidationErrors
];

// User ID parameter validation - generic for any parameter name
const validateUserIdParam = (paramName = 'userId') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  handleValidationErrors
];

// For backward compatibility and content routes
const validateUserId = validateUserIdParam('userId');

// For users routes that use 'id' parameter
const validateUserIdRoute = validateUserIdParam('id');

// Content ID parameter validation
const validateContentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid content ID'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateContentGeneration,
  validateUserId,
  validateUserIdRoute,
  validateContentId,
  handleValidationErrors
};

