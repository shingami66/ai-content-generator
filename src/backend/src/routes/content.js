const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');
const { validateContentGeneration, validateUserId, validateContentId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Routes
router.get('/user/:userId', validateUserId, authenticateToken, ContentController.getUserContent);
router.post('/generate', validateContentGeneration, authenticateToken, ContentController.generateContent);
router.post('/save', authenticateToken, ContentController.saveContent);
router.delete('/:id', validateContentId, authenticateToken, ContentController.deleteContent);

module.exports = router;