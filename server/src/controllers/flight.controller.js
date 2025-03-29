const amadeusService = require('../services/amadeus.service');
const emailService = require('../services/email.service');
const { asyncHandler } = require('../middleware/validation.middleware');

// Search flights
const searchFlights = asyncHandler(async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      travelClass
    } = req.query;

    const flights = await amadeusService.searchFlights({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: parseInt(adults),
      travelClass: travelClass?.toUpperCase()
    });

    res.json({
      status: 'success',
      results: flights.length,
      data: flights
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to search flights'
    });
  }
});

// Search airports
const searchAirports = asyncHandler(async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        status: 'error',
        message: 'Search keyword is required'
      });
    }

    const airports = await amadeusService.searchAirports(keyword);

    res.json({
      status: 'success',
      results: airports.length,
      data: airports
    });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to search airports'
    });
  }
});

// Get flight price metrics
const getFlightPriceMetrics = asyncHandler(async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate
    } = req.query;

    const priceMetrics = await amadeusService.getFlightPriceMetrics({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate
    });

    res.json({
      status: 'success',
      data: priceMetrics
    });
  } catch (error) {
    console.error('Price metrics error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get price metrics'
    });
  }
});

// Share flight details via email
const shareFlightDetails = asyncHandler(async (req, res) => {
  try {
    const { email, flightDetails } = req.body;

    if (!email || !flightDetails) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and flight details are required'
      });
    }

    await emailService.sendFlightDetails(email, flightDetails);

    res.json({
      status: 'success',
      message: 'Flight details sent successfully'
    });
  } catch (error) {
    console.error('Share flight details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to send flight details'
    });
  }
});

module.exports = {
  searchFlights,
  searchAirports,
  getFlightPriceMetrics,
  shareFlightDetails
}; 