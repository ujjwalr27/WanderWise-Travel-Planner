const { validationResult } = require('express-validator');
const Itinerary = require('../models/itinerary.model');
const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/validation.middleware');
const emailService = require('../services/email.service');

// Create new itinerary
const createItinerary = asyncHandler(async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      preferences,
      dayPlans,
      tips
    } = req.body;

    // Debug log
    console.log('Received itinerary data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!destination || !destination.city || !destination.country || !destination.coordinates) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Destination information is incomplete',
        details: { destination: 'Must include city, country, and coordinates' }
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Date information is missing',
        details: { dates: 'Start date and end date are required' }
      });
    }

    if (!budget || typeof budget.planned !== 'number' || !budget.currency) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Budget information is incomplete',
        details: { budget: 'Must include planned amount (number) and currency' }
      });
    }

    // Ensure dayPlans is an array
    if (!Array.isArray(dayPlans)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Day plans must be an array',
        details: { dayPlans: 'Invalid format for day plans' }
      });
    }

    // Format the itinerary data
    const itineraryData = {
      user: req.user._id,
      title: `${destination.city} Trip`,
      destination: {
        city: String(destination.city).trim(),
        country: String(destination.country).trim(),
        coordinates: Array.isArray(destination.coordinates) ? 
          destination.coordinates.map(Number) : [0, 0]
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: {
        planned: Number(budget.planned),
        actual: dayPlans.reduce((total, day) => {
          if (!Array.isArray(day.activities)) return total;
          return total + day.activities.reduce((dayTotal, activity) => {
            return dayTotal + (Number(activity.cost?.amount) || 0);
          }, 0);
        }, 0),
        currency: String(budget.currency).toUpperCase()
      },
      travelStyle: String(travelStyle).toLowerCase(),
      dayPlans: dayPlans.map(day => ({
        date: new Date(day.date),
        activities: Array.isArray(day.activities) ? day.activities.map(activity => ({
          type: String(activity.type).toLowerCase(),
          title: String(activity.title).trim(),
          description: activity.description ? String(activity.description).trim() : '',
          startTime: String(activity.startTime),
          endTime: String(activity.endTime),
          cost: {
            amount: Number(activity.cost?.amount) || 0,
            currency: activity.cost?.currency ? 
              String(activity.cost.currency).toUpperCase() : 
              String(budget.currency).toUpperCase()
          },
          location: {
            name: String(activity.location.name).trim(),
            address: String(activity.location.address).trim(),
            coordinates: Array.isArray(activity.location.coordinates) ? 
              activity.location.coordinates.map(Number) : [0, 0],
            placeId: activity.location.placeId ? 
              String(activity.location.placeId).trim() : undefined
          },
          notes: activity.notes ? String(activity.notes).trim() : ''
        })) : [],
        notes: day.notes ? String(day.notes).trim() : ''
      })),
      preferences: {
        interests: Array.isArray(preferences?.interests) ? 
          preferences.interests.map(String) : [],
        accessibility: Array.isArray(preferences?.accessibility) ? 
          preferences.accessibility.map(String) : [],
        dietaryRestrictions: Array.isArray(preferences?.dietaryRestrictions) ? 
          preferences.dietaryRestrictions.map(String) : []
      },
      status: 'draft',
      isPublic: false,
      aiGenerated: true
    };

    // Debug log
    console.log('Formatted itinerary data:', JSON.stringify(itineraryData, null, 2));

    // Validate dates
    if (itineraryData.endDate < itineraryData.startDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'End date must be after start date',
        details: { dates: 'Invalid date range' }
      });
    }

    // Create and save the itinerary
    const itinerary = new Itinerary(itineraryData);
    
    try {
      await itinerary.save();
    } catch (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Failed to validate itinerary data',
        details: Object.keys(validationError.errors || {}).reduce((acc, key) => {
          acc[key] = validationError.errors[key].message;
          return acc;
        }, {})
      });
    }

    // Add to user's saved itineraries
    if (!req.user.savedItineraries) {
      req.user.savedItineraries = [];
    }
    req.user.savedItineraries.push(itinerary._id);
    await req.user.save();

    // Return both itinerary and tips
    res.status(201).json({
      itinerary: itinerary.toObject(),
      tips: Array.isArray(tips) ? tips : []
    });
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create itinerary',
      details: { server: error.message }
    });
  }
});

// Get all user's itineraries
const getUserItineraries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const sortBy = req.query.sortBy || '-createdAt';

  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }

  const itineraries = await Itinerary.find(query)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sharedWith', 'firstName lastName email');

  const total = await Itinerary.countDocuments(query);

  res.json({
    itineraries,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      totalItems: total
    }
  });
});

// Get single itinerary
const getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    $or: [
      { user: req.user._id },
      { sharedWith: req.user._id },
      { isPublic: true }
    ]
  }).populate('user', 'firstName lastName email')
    .populate('sharedWith', 'firstName lastName email');

  if (!itinerary) {
    return res.status(404).json({
      error: 'Itinerary not found'
    });
  }

  res.json({ itinerary });
});

// Update itinerary
const updateItinerary = asyncHandler(async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'title',
    'destination',
    'startDate',
    'endDate',
    'budget',
    'travelStyle',
    'preferences',
    'dayPlans',
    'status',
    'isPublic'
  ];

  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).json({
      error: 'Invalid updates'
    });
  }

  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      error: 'Itinerary not found'
    });
  }

  updates.forEach(update => {
    itinerary[update] = req.body[update];
  });

  await itinerary.save();
  res.json({ itinerary });
});

// Delete itinerary
const deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      error: 'Itinerary not found'
    });
  }

  // Remove from user's saved itineraries
  req.user.savedItineraries = req.user.savedItineraries.filter(
    id => id.toString() !== itinerary._id.toString()
  );
  await req.user.save();

  res.json({ message: 'Itinerary deleted successfully' });
});

// Share itinerary with other users
const shareItinerary = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }

    // Find the itinerary with populated user data
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'firstName lastName email');

    if (!itinerary) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinerary not found'
      });
    }

    // Check if recipient is a registered user
    const userToShare = await User.findOne({ email });

    // If user exists, check if already shared
    if (userToShare) {
      const isAlreadyShared = itinerary.sharedWith.includes(userToShare._id);
      if (isAlreadyShared) {
        // Even if already shared, still send the email
        try {
          await emailService.sendShareItineraryEmail(email, req.user, itinerary);
          return res.json({
            status: 'success',
            message: 'Itinerary reshared successfully',
            sharedWith: email
          });
        } catch (emailError) {
          console.error('Failed to send share notification email:', emailError);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to send share notification email'
          });
        }
      }

      // Add user to shared list if not already shared
      itinerary.sharedWith.push(userToShare._id);
      await itinerary.save();
    }

    // Send email notification regardless of whether recipient is registered
    try {
      await emailService.sendShareItineraryEmail(email, req.user, itinerary);
      
      res.json({
        status: 'success',
        message: 'Itinerary shared successfully',
        sharedWith: email
      });
    } catch (emailError) {
      console.error('Failed to send share notification email:', emailError);
      
      // If the user was added to sharedWith, remove them since email failed
      if (userToShare) {
        itinerary.sharedWith = itinerary.sharedWith.filter(id => !id.equals(userToShare._id));
        await itinerary.save();
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to send share notification email'
      });
    }
  } catch (error) {
    console.error('Share itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to share itinerary'
    });
  }
});

// Add activity to day plan
const addActivity = asyncHandler(async (req, res) => {
  const { dayIndex, activity } = req.body;

  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      error: 'Itinerary not found'
    });
  }

  if (!itinerary.dayPlans[dayIndex]) {
    return res.status(400).json({
      error: 'Invalid day index'
    });
  }

  itinerary.dayPlans[dayIndex].activities.push(activity);
  await itinerary.save();

  res.json({
    message: 'Activity added successfully',
    activity: itinerary.dayPlans[dayIndex].activities.slice(-1)[0]
  });
});

// Search nearby places
const searchNearbyPlaces = asyncHandler(async (req, res) => {
  const { latitude, longitude, type, radius } = req.query;

  // This would typically use Google Places API or similar
  // Implement external API call here

  res.json({
    message: 'Search nearby places - To be implemented with external API'
  });
});

module.exports = {
  createItinerary,
  getUserItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  shareItinerary,
  addActivity,
  searchNearbyPlaces
}; 