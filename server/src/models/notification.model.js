const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'ITINERARY_SHARED',
      'ITINERARY_UPDATED',
      'TRAVEL_REMINDER',
      'WEATHER_ALERT',
      'ACTIVITY_REMINDER',
      'BUDGET_ALERT',
      'SYSTEM_MESSAGE'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Automatically delete after 30 days
  }
});

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

// Methods
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
};

// Statics
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, read: false });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  await this.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 