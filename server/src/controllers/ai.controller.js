const { validationResult } = require('express-validator');
const aiService = require('../services/ai.service');
const Itinerary = require('../models/itinerary.model');
const { asyncHandler } = require('../middleware/validation.middleware');

// Generate AI itinerary
const generateItinerary = asyncHandler(async (req, res) => {
  const {
    destination,
    startDate,
    endDate,
    travelStyle,
    budget,
    preferences
  } = req.body;

  // Validate maximum duration is 4 days
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const durationDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));

  if (durationDays > 4) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Itinerary duration cannot exceed 4 days'
    });
  }

  try {
    // Generate itinerary using AI
    const itineraryData = await aiService.generateItinerary({
      userId: req.user?._id,
      destination,
      startDate,
      endDate,
      travelStyle,
      budget,
      preferences
    });

    if (!itineraryData || !itineraryData.dayPlans) {
      throw new Error('Failed to generate valid itinerary data');
    }

    // Transform AI response to match Itinerary model structure
    const formattedItinerary = {
      user: req.user._id,
      title: `${destination.city} Trip`,
      destination: {
        city: destination.city,
        country: destination.country,
        coordinates: destination.coordinates
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: {
        planned: Number(budget.planned),
        actual: itineraryData.dayPlans.reduce((total, day) => {
          return total + day.activities.reduce((dayTotal, activity) => {
            return dayTotal + (activity.cost?.amount || 0);
          }, 0);
        }, 0),
        currency: budget.currency
      },
      travelStyle,
      dayPlans: itineraryData.dayPlans.map(day => ({
        date: new Date(day.date),
        activities: day.activities.map(activity => ({
          type: activity.type.toLowerCase(),
          title: activity.title,
          description: activity.description || '',
          startTime: activity.startTime,
          endTime: activity.endTime,
          cost: {
            amount: Number(activity.cost.amount),
            currency: activity.cost.currency
          },
          location: {
            name: activity.location.name,
            address: activity.location.address,
            coordinates: activity.location.coordinates,
            placeId: activity.location.placeId
          },
          notes: activity.notes || ''
        })),
        notes: day.notes || ''
      })),
      preferences: preferences || {},
      status: 'draft',
      isPublic: false,
      aiGenerated: true
    };

    // Create new itinerary
    const itinerary = new Itinerary(formattedItinerary);
    
    try {
      await itinerary.save();
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Failed to validate itinerary data',
        details: validationError.errors
      });
    }

    // Add to user's saved itineraries if user exists
    if (req.user) {
      req.user.savedItineraries = req.user.savedItineraries || [];
      req.user.savedItineraries.push(itinerary._id);
      await req.user.save();
    }

    // Return both itinerary and tips
    res.status(201).json({
      itinerary: itinerary.toObject(),
      tips: itineraryData.tips || []
    });
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({
      error: 'AI Service Error',
      message: error.message || 'Failed to generate itinerary'
    });
  }
});

// Get destination insights
const getDestinationInsights = asyncHandler(async (req, res) => {
  const { city, country } = req.query;

  if (!city || !country) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'City and country are required'
    });
  }

  try {
    const insights = await aiService.getDestinationInsights({
      city,
      country
    });

    res.json({ insights });
  } catch (error) {
    console.error('Get destination insights error:', error);
    res.status(500).json({
      error: 'AI Service Error',
      message: error.message || 'Failed to get destination insights'
    });
  }
});

// Get activity suggestions
const getActivitySuggestions = asyncHandler(async (req, res) => {
  const { location, preferences } = req.body;

  if (!location || !preferences) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Location and preferences are required'
    });
  }

  try {
    const suggestions = await aiService.suggestActivities(
      preferences,
      location
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Get activity suggestions error:', error);
    res.status(500).json({
      error: 'AI Service Error',
      message: error.message || 'Failed to get activity suggestions'
    });
  }
});

// Optimize itinerary
const optimizeItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { preferences } = req.body;

  if (!id || !preferences) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Itinerary ID and preferences are required'
    });
  }

  try {
    const optimizedData = await aiService.optimizeItinerary(id, preferences);
    res.json({ itinerary: optimizedData });
  } catch (error) {
    console.error('Optimize itinerary error:', error);
    res.status(500).json({
      error: 'AI Service Error',
      message: error.message || 'Failed to optimize itinerary'
    });
  }
});

// Get travel recommendations
const getTravelRecommendations = asyncHandler(async (req, res) => {
  const { preferences, season, duration, budget } = req.body;

  if (!preferences || !season || !duration || !budget) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'All parameters (preferences, season, duration, budget) are required'
    });
  }

  try {
    const recommendations = await aiService.getTravelRecommendations({
      preferences,
      season,
      duration,
      budget
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('Get travel recommendations error:', error);
    res.status(500).json({
      error: 'AI Service Error',
      message: error.message || 'Failed to get travel recommendations'
    });
  }
});

module.exports = {
  generateItinerary,
  getDestinationInsights,
  getActivitySuggestions,
  optimizeItinerary,
  getTravelRecommendations
}; 