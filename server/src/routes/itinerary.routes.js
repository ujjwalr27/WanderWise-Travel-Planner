const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const itineraryController = require('../controllers/itinerary.controller');

const router = express.Router();

// Protect all itinerary routes
router.use(auth);

// Create new itinerary
router.post(
  '/',
  [
    body('destination').isObject().withMessage('Destination is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('travelStyle').isString().withMessage('Travel style is required'),
    body('budget').isObject().withMessage('Budget is required')
  ],
  validateRequest,
  itineraryController.createItinerary
);

// Get all user's itineraries
router.get('/', itineraryController.getUserItineraries);

// Get single itinerary
router.get('/:id', itineraryController.getItinerary);

// Update itinerary
router.patch('/:id', itineraryController.updateItinerary);

// Delete itinerary
router.delete('/:id', itineraryController.deleteItinerary);

// Share itinerary
router.post(
  '/:id/share',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validateRequest,
  itineraryController.shareItinerary
);

module.exports = router; 