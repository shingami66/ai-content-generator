const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// Simple Gemini text generation (auth-protected like other endpoints)
router.post('/generate-text', authenticateToken, AIController.generateText);

module.exports = router;

