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

      // Validate that dates are in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Format dates to ensure they're in YYYY-MM-DD format
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      const formattedDepartureDate = formatDate(departureDate);
      const departureDateTime = new Date(formattedDepartureDate);
      
      // Use current date for API requests instead of future dates
      // Amadeus test environment doesn't accept dates too far in the future
      const currentDate = new Date();
      const apiDepartureDate = currentDate.toISOString().split('T')[0];
      
      let apiReturnDate = null;
      if (returnDate) {
        const formattedReturnDate = formatDate(returnDate);
        const returnDateTime = new Date(formattedReturnDate);
        
        // Make sure return date is after departure date
        if (returnDateTime < departureDateTime) {
          throw new Error('Return date must be after departure date');
        }
        
        // Set API return date to next day from current date
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        apiReturnDate = nextDay.toISOString().split('T')[0];
      }

      const searchParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate: apiDepartureDate,
        adults,
        travelClass,
        ...(apiReturnDate && { returnDate: apiReturnDate }),
        currencyCode: 'USD',
        max: 20 // Limit results
      };

      const response = await this.amadeus.shopping.flightOffersSearch.get(searchParams);
      
      // Store the original dates to use in the response
      const formattedResponse = this.formatFlightResults(response.data);
      
      // Add a note about using test dates
      formattedResponse.testEnvironmentNote = "Using test environment dates. In production, the actual requested dates would be used.";
      
      return formattedResponse;
    } catch (error) {
      console.error('Flight search error:', error);
      throw new Error(error.description?.[0]?.detail || error.message || 'Failed to search flights');
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
    // Transform flight data
    const formattedData = data.map(offer => ({
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

    // Add properties to the array
    Object.defineProperty(formattedData, 'testEnvironmentNote', {
      value: undefined,
      writable: true,
      enumerable: true
    });
    
    return formattedData;
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