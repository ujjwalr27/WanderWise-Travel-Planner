const Amadeus = require('amadeus');

class AmadeusService {
  constructor() {
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
      console.error('Amadeus API credentials missing. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
      throw new Error('Amadeus API credentials missing');
    }

    try {
      this.amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET
      });
      console.log('Amadeus service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Amadeus service:', error);
      throw new Error('Amadeus service initialization failed');
    }
  }

  async searchFlights(params) {
    try {
      const {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults = 1,
        travelClass = 'ECONOMY'
      } = params;

      // Validate required parameters
      if (!originLocationCode || !destinationLocationCode || !departureDate) {
        throw new Error('Missing required flight search parameters');
      }

      const searchParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        adults,
        travelClass,
        ...(returnDate && { returnDate }), // Add returnDate if provided
        currencyCode: 'USD',
        max: 20 // Limit results
      };

      const response = await this.amadeus.shopping.flightOffersSearch.get(searchParams);
      
      return this.formatFlightResults(response.data);
    } catch (error) {
      console.error('Flight search error:', error);
      throw new Error(error.description?.detail || error.message || 'Failed to search flights');
    }
  }

  async searchAirports(keyword) {
    try {
      if (!keyword || keyword.length < 2) {
        throw new Error('Search keyword must be at least 2 characters');
      }

      const response = await this.amadeus.referenceData.locations.get({
        keyword,
        subType: Amadeus.location.any
      });

      return this.formatAirportResults(response.data);
    } catch (error) {
      console.error('Airport search error:', error);
      throw new Error(error.description?.detail || error.message || 'Failed to search airports');
    }
  }

  async getFlightPriceMetrics(params) {
    try {
      const {
        originLocationCode,
        destinationLocationCode,
        departureDate
      } = params;

      if (!originLocationCode || !destinationLocationCode) {
        throw new Error('Origin and destination are required');
      }

      const response = await this.amadeus.analytics.itineraryPriceMetrics.get({
        originIataCode: originLocationCode,
        destinationIataCode: destinationLocationCode,
        departureDate
      });

      return this.formatPriceMetrics(response.data);
    } catch (error) {
      console.error('Price metrics error:', error);
      throw new Error(error.description?.detail || error.message || 'Failed to get price metrics');
    }
  }

  formatFlightResults(data) {
    return data.map(offer => ({
      id: offer.id,
      price: {
        amount: parseFloat(offer.price.total),
        currency: offer.price.currency
      },
      itineraries: offer.itineraries.map(itinerary => ({
        duration: itinerary.duration,
        segments: itinerary.segments.map(segment => ({
          departure: {
            iataCode: segment.departure.iataCode,
            terminal: segment.departure.terminal,
            time: segment.departure.at
          },
          arrival: {
            iataCode: segment.arrival.iataCode,
            terminal: segment.arrival.terminal,
            time: segment.arrival.at
          },
          carrierCode: segment.carrierCode,
          flightNumber: segment.number,
          aircraft: segment.aircraft.code,
          duration: segment.duration,
          stops: 0
        }))
      })),
      validatingAirlineCodes: offer.validatingAirlineCodes,
      travelClass: offer.travelerPricings[0].fareDetailsBySegment[0].cabin
    }));
  }

  formatAirportResults(data) {
    return data.map(location => ({
      iataCode: location.iataCode,
      name: location.name,
      cityName: location.address.cityName,
      countryName: location.address.countryName,
      coordinates: {
        latitude: location.geoCode?.latitude,
        longitude: location.geoCode?.longitude
      }
    }));
  }

  formatPriceMetrics(data) {
    return {
      priceMetrics: data.map(metric => ({
        amount: parseFloat(metric.amount),
        quartile: metric.quartile,
        travelClass: metric.travelClass
      })),
      currencyCode: data[0]?.amount?.split(' ')[1] || 'USD'
    };
  }
}

module.exports = new AmadeusService(); 