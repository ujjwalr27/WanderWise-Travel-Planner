const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// Protect all AI routes
router.use(auth);

// Generate AI itinerary
router.post(
  '/generate',
  [
    body('destination').isObject().withMessage('Destination is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('travelStyle').isString().withMessage('Travel style is required'),
    body('budget').isObject().withMessage('Budget is required')
  ],
  validateRequest,
  aiController.generateItinerary
);

// Get destination insights
router.get('/insights', aiController.getDestinationInsights);

// Get activity suggestions
router.post('/suggest-activities', aiController.getActivitySuggestions);

// Optimize itinerary
router.post(
  '/optimize/:id',
  [
    body('preferences').isObject().withMessage('Preferences are required')
  ],
  validateRequest,
  aiController.optimizeItinerary
);

// Get travel recommendations
router.post(
  '/recommendations',
  [
    body('preferences').isObject().withMessage('Preferences are required'),
    body('season').isString().withMessage('Season is required'),
    body('duration').isInt().withMessage('Duration is required'),
    body('budget').isObject().withMessage('Budget is required')
  ],
  validateRequest,
  aiController.getTravelRecommendations
);

module.exports = router; 