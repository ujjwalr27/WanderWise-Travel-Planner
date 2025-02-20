const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { query } = require('express-validator');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Protect all notification routes
router.use(auth);

// Get notifications
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('read')
      .optional()
      .isBoolean()
      .withMessage('Read status must be a boolean')
  ],
  validateRequest,
  notificationController.getNotifications
);

// Get unread count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read/all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 