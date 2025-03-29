const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// Protect all chat routes with authentication
router.use(auth);

// Get chat history
router.get('/history', chatController.getChatHistory);

// Send message
router.post(
  '/message',
  [
    body('content')
      .notEmpty()
      .withMessage('Message content is required')
      .trim(),
    body('itineraryId')
      .optional()
      .isMongoId()
      .withMessage('Invalid itinerary ID')
  ],
  validateRequest,
  chatController.sendMessage
);

// Get travel suggestions
router.post(
  '/suggestions',
  [
    body('query')
      .notEmpty()
      .withMessage('Query is required')
      .trim()
  ],
  validateRequest,
  chatController.getTravelSuggestions
);

// Clear chat history
router.delete('/history', chatController.clearChatHistory);

module.exports = router; 