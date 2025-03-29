const express = require('express');
const { query, body } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');
const { auth } = require('../middleware/auth.middleware');
const flightController = require('../controllers/flight.controller');

const router = express.Router();

// Protect all flight routes
router.use(auth);

// Search flights
router.get(
  '/search',
  [
    query('origin')
      .isLength({ min: 3, max: 3 })
      .isUppercase()
      .withMessage('Valid origin airport code is required'),
    query('destination')
      .isLength({ min: 3, max: 3 })
      .isUppercase()
      .withMessage('Valid destination airport code is required'),
    query('departureDate')
      .isISO8601()
      .withMessage('Valid departure date is required (YYYY-MM-DD)'),
    query('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Valid return date is required (YYYY-MM-DD)'),
    query('adults')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Number of adults must be between 1 and 9'),
    query('travelClass')
      .optional()
      .isIn(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'])
      .withMessage('Invalid travel class')
  ],
  validateRequest,
  flightController.searchFlights
);

// Search airports
router.get(
  '/airports/search',
  [
    query('keyword')
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search keyword must be at least 2 characters')
  ],
  validateRequest,
  flightController.searchAirports
);

// Get flight price metrics
router.get(
  '/prices',
  [
    query('origin')
      .isLength({ min: 3, max: 3 })
      .isUppercase()
      .withMessage('Valid origin airport code is required'),
    query('destination')
      .isLength({ min: 3, max: 3 })
      .isUppercase()
      .withMessage('Valid destination airport code is required'),
    query('departureDate')
      .optional()
      .isISO8601()
      .withMessage('Valid departure date is required (YYYY-MM-DD)')
  ],
  validateRequest,
  flightController.getFlightPriceMetrics
);

// Share flight details via email
router.post(
  '/share',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email address is required'),
    body('flightDetails')
      .isObject()
      .withMessage('Flight details are required')
  ],
  validateRequest,
  flightController.shareFlightDetails
);

module.exports = router; 