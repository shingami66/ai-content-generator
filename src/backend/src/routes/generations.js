const express = require('express');
const router = express.Router();
const GenerationController = require('../controllers/generationController');
const { validateUserId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Routes
router.get('/can-generate/:userId', validateUserId, authenticateToken, GenerationController.canGenerate);
router.get('/count/:userId', validateUserId, authenticateToken, GenerationController.getCount);
router.post('/increment', authenticateToken, GenerationController.increment);

module.exports = router;