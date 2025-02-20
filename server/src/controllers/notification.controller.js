const notificationService = require('../services/notification.service');
const { asyncHandler } = require('../middleware/validation.middleware');

// Get notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, read } = req.query;
  const result = await notificationService.getNotifications(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    read: read === 'true' ? true : read === 'false' ? false : undefined
  });
  res.json(result);
});

// Get unread count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.json({ count });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user._id);
  res.json(notification);
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.json({ message: 'All notifications marked as read' });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.deleteNotification(id, req.user._id);
  res.json({ message: 'Notification deleted' });
});

// Handle WebSocket connection
const handleWebSocket = (io) => {
  // Store io instance globally for notification service
  global.io = io;

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    // Join user's notification room
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  handleWebSocket
}; 