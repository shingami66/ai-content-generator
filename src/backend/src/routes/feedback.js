const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { validateFeedback } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Submit feedback
router.post('/', validateFeedback, authenticateToken, async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;

    const newFeedback = new Feedback({
      userId,
      rating,
      description: comment
    });

    await newFeedback.save();

    console.log('📝 New feedback saved:', { userId, rating, comment });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get user feedback history
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const feedback = await Feedback.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feedback,
      message: 'Feedback history retrieved'
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
});

module.exports = router;