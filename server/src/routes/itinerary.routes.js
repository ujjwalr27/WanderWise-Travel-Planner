const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, query } = require('express-validator');
const itineraryController = require('../controllers/itinerary.controller');

const router = express.Router();

// Protect all itinerary routes
router.use(auth);

// Create new itinerary
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('destination.city').trim().notEmpty().withMessage('City is required'),
    body('destination.country').trim().notEmpty().withMessage('Country is required'),
    body('destination.coordinates')
      .isArray()
      .withMessage('Coordinates must be an array of [longitude, latitude]')
      .custom((value) => value.length === 2)
      .withMessage('Coordinates must contain exactly 2 values'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
      .withMessage('End date must be after or equal to start date'),
    body('travelStyle')
      .isIn(['luxury', 'budget', 'adventure', 'cultural', 'relaxation'])
      .withMessage('Invalid travel style')
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

// Add activity
router.post(
  '/:id/activities',
  [
    body('dayIndex').isInt({ min: 0 }).withMessage('Invalid day index'),
    body('activity.type')
      .isIn(['flight', 'hotel', 'attraction', 'restaurant', 'transport', 'custom'])
      .withMessage('Invalid activity type'),
    body('activity.title').trim().notEmpty().withMessage('Activity title is required'),
    body('activity.startTime')
      .optional()
      .isISO8601()
      .withMessage('Start time must be a valid date'),
    body('activity.endTime')
      .optional()
      .isISO8601()
      .withMessage('End time must be a valid date')
  ],
  validateRequest,
  itineraryController.addActivity
);

// Search nearby places
router.get(
  '/search/nearby',
  [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    query('type')
      .optional()
      .isString()
      .withMessage('Invalid place type'),
    query('radius')
      .optional()
      .isInt({ min: 1, max: 50000 })
      .withMessage('Radius must be between 1 and 50000 meters')
  ],
  validateRequest,
  itineraryController.searchNearbyPlaces
);

module.exports = router; 