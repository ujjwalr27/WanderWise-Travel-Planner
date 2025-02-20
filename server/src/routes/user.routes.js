const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Protect all user routes
router.use(auth);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.patch(
  '/profile',
  [
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    body('preferences.travelStyle')
      .optional()
      .isIn(['luxury', 'budget', 'adventure', 'cultural', 'relaxation'])
      .withMessage('Invalid travel style'),
    body('preferences.maxBudget')
      .optional()
      .isNumeric()
      .withMessage('Max budget must be a number')
      .custom(value => value > 0)
      .withMessage('Max budget must be greater than 0'),
    body('preferences.preferredDestinations')
      .optional()
      .isArray()
      .withMessage('Preferred destinations must be an array'),
    body('preferences.preferredDestinations.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Destination cannot be empty'),
    body('preferences.dietaryRestrictions')
      .optional()
      .isArray()
      .withMessage('Dietary restrictions must be an array'),
    body('preferences.dietaryRestrictions.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Dietary restriction cannot be empty')
  ],
  validateRequest,
  userController.updateProfile
);

// Change password
router.post(
  '/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ],
  validateRequest,
  userController.changePassword
);

// Get user preferences
router.get('/preferences', userController.getPreferences);

// Update user preferences
router.patch(
  '/preferences',
  [
    body('travelStyle')
      .optional()
      .isIn(['luxury', 'budget', 'adventure', 'cultural', 'relaxation'])
      .withMessage('Invalid travel style'),
    body('maxBudget')
      .optional()
      .isNumeric()
      .withMessage('Max budget must be a number')
      .custom(value => value > 0)
      .withMessage('Max budget must be greater than 0'),
    body('preferredDestinations')
      .optional()
      .isArray()
      .withMessage('Preferred destinations must be an array'),
    body('preferredDestinations.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Destination cannot be empty'),
    body('dietaryRestrictions')
      .optional()
      .isArray()
      .withMessage('Dietary restrictions must be an array'),
    body('dietaryRestrictions.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Dietary restriction cannot be empty')
  ],
  validateRequest,
  userController.updatePreferences
);

module.exports = router;
