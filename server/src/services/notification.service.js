const Notification = require('../models/notification.model');
const { createClient } = require('redis');

class NotificationService {
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL
    });

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.connect();
  }

  async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      
      // Emit real-time notification via WebSocket
      if (global.io) {
        global.io.to(`user:${data.user}`).emit('notification', notification);
      }

      // Update unread count in Redis
      const unreadKey = `notifications:unread:${data.user}`;
      await this.redis.incr(unreadKey);

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(userId, query = {}) {
    try {
      const { page = 1, limit = 20, read } = query;
      const skip = (page - 1) * limit;

      const filter = { user: userId };
      if (typeof read === 'boolean') {
        filter.read = read;
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(filter);

      return {
        notifications,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      throw new Error('Failed to get notifications');
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (!notification.read) {
        await notification.markAsRead();
        
        // Update unread count in Redis
        const unreadKey = `notifications:unread:${userId}`;
        await this.redis.decr(unreadKey);
      }

      return notification;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.markAllAsRead(userId);
      
      // Reset unread count in Redis
      const unreadKey = `notifications:unread:${userId}`;
      await this.redis.set(unreadKey, 0);

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (!notification.read) {
        // Update unread count in Redis
        const unreadKey = `notifications:unread:${userId}`;
        await this.redis.decr(unreadKey);
      }

      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async getUnreadCount(userId) {
    try {
      // Try to get count from Redis first
      const unreadKey = `notifications:unread:${userId}`;
      let count = await this.redis.get(unreadKey);

      if (count === null) {
        // If not in Redis, get from database and cache it
        count = await Notification.getUnreadCount(userId);
        await this.redis.set(unreadKey, count);
      }

      return parseInt(count);
    } catch (error) {
      console.error('Get unread count error:', error);
      throw new Error('Failed to get unread count');
    }
  }
}

module.exports = new NotificationService(); 