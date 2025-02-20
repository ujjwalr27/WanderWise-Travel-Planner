const axios = require('axios');
const https = require('https');

class MapService {
  constructor() {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is required but not provided');
    }

    // Create axios instance with proper configuration
    this.googleMapsClient = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api',
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 10000, // 10 second timeout
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.googleMapsClient.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ENOTFOUND') {
          console.error('DNS lookup failed. Check network connection:', error);
          return Promise.reject(new Error('Unable to connect to Google Maps API. Please check your network connection.'));
        }
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Google Maps API error:', {
            status: error.response.status,
            data: error.response.data
          });
          return Promise.reject(new Error(error.response.data.error_message || 'Google Maps API request failed'));
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          return Promise.reject(new Error('No response received from Google Maps API'));
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', error.message);
          return Promise.reject(new Error('Failed to make request to Google Maps API'));
        }
      }
    );

    // Popular destinations by category for recommendations
    this.categoryQueries = {
      'Popular': 'famous tourist destinations',
      'Beach': 'best beach destinations',
      'Mountains': 'famous mountain destinations',
      'Cities': 'most visited cities',
      'Cultural': 'cultural heritage sites',
      'Adventure': 'adventure tourist spots',
      'Food': 'famous food destinations',
      'Nature': 'natural tourist attractions',
      'Relaxation': 'relaxation resorts destinations'
    };
  }

  async searchPlaces({ query, types = [], categories = [] }) {
    try {
      let searchQuery = query;

      // If no query but categories are provided, use category-based search
      if (!query.trim() && categories.length > 0) {
        const categoryQueries = categories.map(category => 
          this.categoryQueries[category] || `${category} tourist destinations`
        );
        searchQuery = categoryQueries.join(' ');
      }

      // If still no query, default to popular destinations
      if (!searchQuery.trim()) {
        searchQuery = this.categoryQueries['Popular'];
      }

      // Call Google Places Text Search API with retry logic
      const maxRetries = 3;
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.googleMapsClient.get('/place/textsearch/json', {
            params: {
              query: searchQuery,
              type: types.length > 0 ? types.join('|') : 'tourist_attraction|point_of_interest',
              language: 'en'
            }
          });

          if (response.data.status === 'OK') {
            // Get additional details for each place
            const detailsPromises = response.data.results.map(async place => {
              try {
                const detailsResponse = await this.googleMapsClient.get('/place/details/json', {
                  params: {
                    place_id: place.place_id,
                    fields: [
                      'name',
                      'formatted_address',
                      'geometry',
                      'rating',
                      'user_ratings_total',
                      'photos',
                      'editorial_summary',
                      'types',
                      'opening_hours',
                      'price_level'
                    ].join(',')
                  }
                });

                if (detailsResponse.data.status === 'OK') {
                  const details = detailsResponse.data.result;
                  return {
                    id: place.place_id,
                    name: place.name,
                    description: details.editorial_summary?.overview || place.formatted_address,
                    coordinates: [
                      place.geometry.location.lng,
                      place.geometry.location.lat
                    ],
                    rating: place.rating || 0,
                    reviewCount: place.user_ratings_total || 0,
                    photos: details.photos ? details.photos.map(photo => ({
                      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
                      caption: place.name
                    })) : [],
                    categories: [...(place.types || []), ...(categories.length > 0 ? categories : ['Popular'])],
                    tags: [...(place.types || []).map(type => this.formatPlaceType(type)), ...(categories.length > 0 ? categories : ['Popular'])],
                    openingHours: details.opening_hours?.weekday_text,
                    priceLevel: details.price_level,
                    bestTimeToVisit: this.getBestTimeToVisit(place.types)
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching details for place ${place.place_id}:`, error);
                return null;
              }
            });

            const results = await Promise.all(detailsPromises);
            return results.filter(Boolean); // Remove any null results
          }

          if (response.data.status === 'ZERO_RESULTS') {
            return [];
          }

          throw new Error(`Google Places API returned status: ${response.data.status}`);
        } catch (error) {
          lastError = error;
          if (attempt === maxRetries) {
            throw error;
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      throw lastError;
    } catch (error) {
      console.error('Places search error:', error);
      throw new Error(error.message || 'Failed to search places');
    }
  }

  async getDestinationRecommendations() {
    try {
      // Get recommendations for multiple categories
      const categoryPromises = Object.entries(this.categoryQueries)
        .slice(0, 3) // Limit to top 3 categories
        .map(async ([category, query]) => {
          const response = await this.googleMapsClient.get('/place/textsearch/json', {
            params: {
              query,
              type: 'tourist_attraction|point_of_interest',
              language: 'en'
            }
          });

          if (response.data.status === 'OK') {
            return response.data.results.map(place => ({
              id: place.place_id,
              name: place.name,
              description: place.formatted_address,
              coordinates: [
                place.geometry.location.lng,
                place.geometry.location.lat
              ],
              rating: place.rating || 0,
              reviewCount: place.user_ratings_total || 0,
              photos: place.photos ? place.photos.map(photo => ({
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
                caption: place.name
              })) : [],
              categories: [...(place.types || []), category],
              tags: [...(place.types || []).map(type => this.formatPlaceType(type)), category],
              bestTimeToVisit: this.getBestTimeToVisit(place.types)
            }));
          }
          return [];
        });

      const results = await Promise.all(categoryPromises);
      // Flatten and shuffle results
      return results.flat().sort(() => Math.random() - 0.5).slice(0, 12);
    } catch (error) {
      console.error('Recommendations error:', error);
      throw new Error('Failed to get destination recommendations');
    }
  }

  async searchNearbyPlaces(params) {
    try {
      const { latitude, longitude, type, radius = 5000, keyword } = params;

      const response = await this.googleMapsClient.get('/place/nearbysearch/json', {
        params: {
          location: `${latitude},${longitude}`,
          radius,
          type,
          keyword,
          rankby: keyword ? 'prominence' : 'distance'
        }
      });

      if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          location: {
            coordinates: [
              place.geometry.location.lng,
              place.geometry.location.lat
            ],
            address: place.vicinity
          },
          rating: place.rating,
          types: place.types,
          photos: place.photos?.map(photo => ({
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
            width: photo.width,
            height: photo.height
          }))
        }));
      }

      return [];
    } catch (error) {
      console.error('Nearby places error:', error);
      throw new Error('Failed to search nearby places');
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await this.googleMapsClient.get('/place/details/json', {
        params: {
          place_id: placeId,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'opening_hours',
            'website',
            'formatted_phone_number',
            'reviews',
            'price_level',
            'photos',
            'types'
          ].join(',')
        }
      });

      if (response.data.status === 'OK') {
        const place = response.data.result;
        return {
          id: place.place_id,
          name: place.name,
          location: {
            coordinates: [
              place.geometry.location.lng,
              place.geometry.location.lat
            ],
            address: place.formatted_address
          },
          rating: place.rating,
          openingHours: place.opening_hours?.weekday_text,
          website: place.website,
          phone: place.formatted_phone_number,
          reviews: place.reviews?.map(review => ({
            author: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time
          })),
          priceLevel: place.price_level,
          photos: place.photos?.map(photo => ({
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
            width: photo.width,
            height: photo.height
          })),
          categories: place.types
        };
      }

      throw new Error(response.data.status);
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  async geocode(address) {
    try {
      const response = await this.googleMapsClient.get('/geocode/json', {
        params: {
          address,
          language: 'en'
        }
      });

      if (response.data.status === 'OK') {
        const result = response.data.results[0];
        return {
          coordinates: [
            result.geometry.location.lng,
            result.geometry.location.lat
          ],
          formattedAddress: result.formatted_address,
          placeId: result.place_id
        };
      }

      throw new Error(response.data.status);
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  async getDirections(origin, destination, mode = 'driving') {
    try {
      const response = await this.googleMapsClient.get('/directions/json', {
        params: {
          origin: origin.join(','),
          destination: destination.join(','),
          mode
        }
      });

      if (response.data.status === 'OK') {
        const route = response.data.routes[0];
        return {
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          steps: route.legs[0].steps.map(step => ({
            instructions: step.html_instructions,
            distance: step.distance,
            duration: step.duration,
            coordinates: [
              step.end_location.lng,
              step.end_location.lat
            ]
          })),
          polyline: route.overview_polyline.points
        };
      }

      throw new Error(response.data.status);
    } catch (error) {
      console.error('Directions error:', error);
      throw new Error('Failed to get directions');
    }
  }

  // Helper method to format place types for display
  formatPlaceType(type) {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Helper method to suggest best time to visit based on place types
  getBestTimeToVisit(types = []) {
    if (types.includes('beach')) {
      return 'Best during summer months for optimal weather';
    }
    if (types.includes('ski_resort')) {
      return 'Best during winter months for snow activities';
    }
    if (types.includes('museum')) {
      return 'Year-round, weekday mornings are less crowded';
    }
    if (types.includes('amusement_park')) {
      return 'Spring or fall for mild weather and shorter queues';
    }
    return 'Year-round, check local weather conditions';
  }
}

module.exports = new MapService();
