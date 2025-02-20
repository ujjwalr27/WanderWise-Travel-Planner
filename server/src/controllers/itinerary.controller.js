const { validationResult } = require('express-validator');
const Itinerary = require('../models/itinerary.model');
const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/validation.middleware');
const emailService = require('../services/email.service');
const { validateItineraryData } = require('../utils/validationUtils');

// Create new itinerary
const createItinerary = asyncHandler(async (req, res) => {
  const itineraryData = {
    ...req.body,
    user: req.user._id
  };

  const itinerary = new Itinerary(itineraryData);
  await itinerary.save();

  res.status(201).json({
    status: 'success',
    itinerary
  });
});

// Get all user's itineraries
const getUserItineraries = asyncHandler(async (req, res) => {
  const itineraries = await Itinerary.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    itineraries
  });
});

// Get single itinerary
const getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      status: 'error',
      message: 'Itinerary not found'
    });
  }

  res.json({
    status: 'success',
    itinerary
  });
});

// Update itinerary
const updateItinerary = asyncHandler(async (req, res) => {
  const updates = req.body;
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      status: 'error',
      message: 'Itinerary not found'
    });
  }

  Object.assign(itinerary, updates);
  await itinerary.save();

  res.json({
    status: 'success',
    itinerary
  });
});

// Delete itinerary
const deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      status: 'error',
      message: 'Itinerary not found'
    });
  }

  res.json({
    status: 'success',
    message: 'Itinerary deleted successfully'
  });
});

// Add activity to itinerary
const addActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, activity } = req.body;

  if (!date || !activity) {
    return res.status(400).json({
      status: 'error',
      message: 'Date and activity details are required'
    });
  }

  const itinerary = await Itinerary.findOne({
    _id: id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      status: 'error',
      message: 'Itinerary not found'
    });
  }

  // Find or create day plan for the given date
  let dayPlan = itinerary.dayPlans.find(day => 
    new Date(day.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
  );

  if (!dayPlan) {
    dayPlan = {
      date: new Date(date),
      activities: []
    };
    itinerary.dayPlans.push(dayPlan);
  }

  // Add the new activity
  dayPlan.activities.push({
    type: activity.type,
    title: activity.title,
    description: activity.description || '',
    location: {
      name: activity.location.name,
      address: activity.location.address,
      coordinates: activity.location.coordinates,
      placeId: activity.location.placeId
    },
    startTime: activity.startTime,
    endTime: activity.endTime,
    cost: {
      amount: Number(activity.cost.amount) || 0,
      currency: activity.cost.currency || 'USD'
    },
    notes: activity.notes || ''
  });

  // Sort day plans by date
  itinerary.dayPlans.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Sort activities by start time
  dayPlan.activities.sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  // Save the updated itinerary
  await itinerary.save();

  res.json({
    status: 'success',
    itinerary
  });
});

// Share itinerary
const shareItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const itinerary = await Itinerary.findOne({
    _id: id,
    user: req.user._id
  });

  if (!itinerary) {
    return res.status(404).json({
      status: 'error',
      message: 'Itinerary not found'
    });
  }

  // Add email to shared list
  if (!itinerary.sharedWith.includes(email)) {
    itinerary.sharedWith.push(email);
    await itinerary.save();
  }

  res.json({
    status: 'success',
    message: 'Itinerary shared successfully'
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
  addActivity,
  shareItinerary,
  searchNearbyPlaces
}; 