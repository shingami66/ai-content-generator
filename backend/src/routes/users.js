const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const { validateUserIdRoute, handleValidationErrors } = require('../middlewares/validation');
const { body } = require('express-validator');

// Get user profile
router.get('/:id', authenticateToken, validateUserIdRoute, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await db.query(
      'SELECT UserID as id, Username, Email FROM registereduser WHERE UserID = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user', 
      error: error.message 
    });
  }
});

// Update user profile
router.put('/:id', authenticateToken, validateUserIdRoute, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is trying to access their own profile
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { username, email } = req.body;

    console.log('📝 Updating user profile:', { id, username, email });

    await db.query(
      'UPDATE registereduser SET Username = ?, Email = ? WHERE UserID = ?',
      [username, email, id]
    );

    console.log('✅ Profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Update user error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
});

module.exports = router;
