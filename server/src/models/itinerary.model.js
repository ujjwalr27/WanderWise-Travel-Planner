const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cultural', 'local', 'relaxation', 'transport', 'dining', 'shopping', 'entertainment', 'sightseeing'],
    required: true,
    set: v => v.toLowerCase() // Convert to lowercase before saving
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && 
                 v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    },
    placeId: {
      type: String,
      trim: true
    }
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  cost: {
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      trim: true,
      uppercase: true
    }
  },
  bookingInfo: {
    confirmationNumber: String,
    bookingUrl: String,
    provider: String
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
});

const dayPlanSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  activities: [activitySchema],
  notes: String
});

const itinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  destination: {
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    planned: Number,
    actual: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  travelStyle: {
    type: String,
    enum: ['luxury', 'budget', 'adventure', 'cultural', 'relaxation'],
    required: true
  },
  dayPlans: [dayPlanSchema],
  preferences: {
    dietaryRestrictions: [String],
    accessibility: [String],
    interests: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
itinerarySchema.index({ 'destination.coordinates': '2dsphere' });

// Method to calculate total cost
itinerarySchema.methods.calculateTotalCost = function() {
  return this.dayPlans.reduce((total, day) => {
    const dayCost = day.activities.reduce((sum, activity) => {
      return sum + (activity.cost?.amount || 0);
    }, 0);
    return total + dayCost;
  }, 0);
};

// Update actual budget when saved
itinerarySchema.pre('save', function(next) {
  if (this.isModified('dayPlans')) {
    this.budget.actual = this.calculateTotalCost();
  }
  next();
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary; 