const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');

// Generic profile route (using auth user)
// Generic profile route (using auth user)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const Subscription = require('../models/Subscription');

    const user = await User.findById(req.user.id).select('-password').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get active subscription end date
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'active'
    }).sort({ endDate: -1 });

    if (subscription) {
      user.subscriptionEndDate = subscription.endDate;
    }

    res.json({
      success: true,
      user,
      message: 'User profile retrieved'
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profile by ID
router.get('/:id', authenticateToken, UserController.getUserById);

// Update profile by ID
router.put('/:id', authenticateToken, UserController.updateUser);

module.exports = router;