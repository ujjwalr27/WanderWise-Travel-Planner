const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, query } = require('express-validator');
const mapController = require('../controllers/map.controller');

const router = express.Router();

// Public routes
router.get(
  '/destinations/search',
  [
    query('query')
      .optional()
      .isString()
      .trim(),
    query('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array')
  ],
  validateRequest,
  mapController.searchDestinations
);

// Get destination recommendations
router.get(
  '/destinations/recommendations',
  mapController.getDestinationRecommendations
);

// Protected routes
router.use(auth);

// Geocode address
router.post(
  '/geocode',
  [
    body('address')
      .notEmpty()
      .withMessage('Address is required')
  ],
  validateRequest,
  mapController.geocodeAddress
);

// Search nearby places
router.get(
  '/nearby',
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
  mapController.searchNearbyPlaces
);

// Get place details
router.get(
  '/place/:placeId',
  mapController.getPlaceDetails
);

// Get directions
router.get(
  '/directions',
  [
    query('originLat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid origin latitude'),
    query('originLng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid origin longitude'),
    query('destinationLat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid destination latitude'),
    query('destinationLng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid destination longitude'),
    query('mode')
      .optional()
      .isIn(['driving', 'walking', 'bicycling', 'transit'])
      .withMessage('Invalid travel mode')
  ],
  validateRequest,
  mapController.getDirections
);

module.exports = router; 