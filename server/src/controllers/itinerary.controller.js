const { validationResult } = require('express-validator');
const Itinerary = require('../models/itinerary.model');
const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/validation.middleware');
const emailService = require('../services/email.service');
const { validateItineraryData } = require('../utils/validationUtils');

// Create new itinerary
const createItinerary = asyncHandler(async (req, res) => {
  try {
    const validationResult = await validateItineraryData(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validationResult.errors.message
      });
    }

    // Check for existing itinerary with same destination and dates
    const existingItinerary = await Itinerary.findOne({
      user: req.user._id,
      'destination.city': validationResult.data.destination.city,
      'destination.country': validationResult.data.destination.country,
      startDate: validationResult.data.startDate,
      endDate: validationResult.data.endDate
    });

    if (existingItinerary) {
      return res.status(400).json({
        status: 'error',
        message: 'An itinerary for this destination and dates already exists'
      });
    }

    // Generate a default title if not provided
    const itineraryData = {
      ...validationResult.data,
      user: req.user._id,
      title: validationResult.data.title || `${validationResult.data.destination.city} Trip`
    };

    const itinerary = new Itinerary(itineraryData);
    await itinerary.save();

    // Add to user's saved itineraries
    if (!req.user.savedItineraries) {
      req.user.savedItineraries = [];
    }
    if (!req.user.savedItineraries.includes(itinerary._id)) {
      req.user.savedItineraries.push(itinerary._id);
      await req.user.save();
    }

    res.status(201).json({
      status: 'success',
      itinerary
    });
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
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
  try {
    const validationResult = await validateItineraryData(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validationResult.errors.message
      });
    }

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

    // Ensure title is preserved or updated
    const updates = {
      ...validationResult.data,
      title: validationResult.data.title || itinerary.title || `${validationResult.data.destination.city} Trip`
    };

    Object.assign(itinerary, updates);
    await itinerary.save();

    res.json({
      status: 'success',
      itinerary
    });
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
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

  // Remove from user's saved itineraries
  if (req.user.savedItineraries) {
    req.user.savedItineraries = req.user.savedItineraries.filter(
      id => id.toString() !== itinerary._id.toString()
    );
    await req.user.save();
  }

  res.json({
    status: 'success',
    message: 'Itinerary deleted successfully'
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

module.exports = {
  createItinerary,
  getUserItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  shareItinerary
}; 