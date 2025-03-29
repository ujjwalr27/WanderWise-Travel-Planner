const mapService = require('../services/map.service');
const { asyncHandler } = require('../middleware/validation.middleware');

// Search destinations using Google Places API
const searchDestinations = asyncHandler(async (req, res) => {
  try {
    // Parse and validate query parameters
    const query = String(req.query.query || '').trim();
    const categories = Array.isArray(req.query.categories) 
      ? req.query.categories 
      : [req.query.categories].filter(Boolean);

    // Add delay between requests to avoid rate limiting
    if (req.query.page > 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const places = await mapService.searchPlaces({
      query,
      types: ['locality', 'tourist_attraction', 'point_of_interest'],
      categories
    });

    return res.json({
      status: 'success',
      results: places.length,
      data: places
    });
  } catch (error) {
    console.error('Places search error:', error);
    
    // Handle specific error cases
    if (error.message.includes('ENOTFOUND')) {
      return res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable. Please try again later.'
      });
    }
    
    if (error.message.includes('OVER_QUERY_LIMIT')) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.'
      });
    }

    if (error.message.includes('REQUEST_DENIED')) {
      return res.status(403).json({
        status: 'error',
        message: 'API request denied. Please check API key configuration.'
      });
    }

    if (error.message.includes('INVALID_REQUEST')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request parameters.'
      });
    }

    // Default error response
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while searching for destinations.'
    });
  }
});

// Get destination recommendations
const getDestinationRecommendations = asyncHandler(async (req, res) => {
  try {
    const destinations = await mapService.getDestinationRecommendations();
    
    if (!destinations || destinations.length === 0) {
      return res.json({
        status: 'success',
        results: 0,
        data: [],
        message: 'No recommendations available at the moment'
      });
    }

    return res.json({
      status: 'success',
      results: destinations.length,
      data: destinations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    
    // Handle specific error cases
    if (error.message.includes('ENOTFOUND')) {
      return res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable. Please try again later.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to get destination recommendations'
    });
  }
});

// Geocode address
const geocodeAddress = asyncHandler(async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address is required'
      });
    }

    const result = await mapService.geocode(address);
    return res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to geocode address'
    });
  }
});

// Search nearby places
const searchNearbyPlaces = asyncHandler(async (req, res) => {
  try {
    const { latitude, longitude, type, radius, keyword } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const places = await mapService.searchNearbyPlaces({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      type,
      radius: parseInt(radius),
      keyword
    });

    return res.json({
      status: 'success',
      results: places.length,
      data: places
    });
  } catch (error) {
    console.error('Nearby places error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to search nearby places'
    });
  }
});

// Get place details
const getPlaceDetails = asyncHandler(async (req, res) => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Place ID is required'
      });
    }

    const details = await mapService.getPlaceDetails(placeId);
    return res.json({
      status: 'success',
      data: details
    });
  } catch (error) {
    console.error('Place details error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get place details'
    });
  }
});

// Get directions
const getDirections = asyncHandler(async (req, res) => {
  try {
    const {
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      mode
    } = req.query;

    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return res.status(400).json({
        status: 'error',
        message: 'Origin and destination coordinates are required'
      });
    }

    const directions = await mapService.getDirections(
      [parseFloat(originLat), parseFloat(originLng)],
      [parseFloat(destinationLat), parseFloat(destinationLng)],
      mode
    );

    return res.json({
      status: 'success',
      data: directions
    });
  } catch (error) {
    console.error('Directions error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get directions'
    });
  }
});

module.exports = {
  searchDestinations,
  getDestinationRecommendations,
  geocodeAddress,
  searchNearbyPlaces,
  getPlaceDetails,
  getDirections
}; 