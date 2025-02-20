import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

export const useAI = () => {
  // Generate AI itinerary
  const useGenerateItinerary = () => {
    return useMutation(
      async (data) => {
        try {
          const response = await axios.post('/api/ai/generate', data);
          if (!response.data || !response.data.itinerary) {
            throw new Error('Invalid response format from server');
          }
          return response.data;
        } catch (error) {
          console.error('Failed to generate itinerary:', error);
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          } else if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
          } else if (error.message) {
            throw new Error(error.message);
          } else {
            throw new Error('Failed to generate itinerary. Please try again.');
          }
        }
      }
    );
  };

  // Get destination insights
  const useDestinationInsights = (params) => {
    return useQuery(
      ['insights', params],
      async () => {
        if (!params?.city || !params?.country) return null;
        const response = await axios.get('/api/ai/insights', { params });
        return response.data.insights;
      },
      {
        enabled: !!params?.city && !!params?.country,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        retry: 1,
        onError: (error) => {
          console.error('Failed to fetch destination insights:', error);
          return {
            bestTimeToVisit: 'Information not available at the moment.',
            localCustoms: 'Information not available at the moment.',
            transportation: 'Information not available at the moment.'
          };
        }
      }
    );
  };

  // Get activity suggestions
  const useActivitySuggestions = () => {
    return useMutation(
      async (data) => {
        const response = await axios.post('/api/ai/suggest-activities', data);
        return response.data.suggestions;
      },
      {
        onError: (error) => {
          console.error('Failed to get activity suggestions:', error);
          throw new Error(error.response?.data?.message || 'Failed to get activity suggestions');
        }
      }
    );
  };

  // Optimize itinerary
  const useOptimizeItinerary = () => {
    return useMutation(
      async ({ id, data }) => {
        const response = await axios.post(`/api/ai/optimize/${id}`, data);
        return response.data.itinerary;
      },
      {
        onError: (error) => {
          console.error('Failed to optimize itinerary:', error);
          throw new Error(error.response?.data?.message || 'Failed to optimize itinerary');
        }
      }
    );
  };

  // Get travel recommendations
  const useRecommendations = () => {
    return useMutation(
      async (data) => {
        const response = await axios.post('/api/ai/recommendations', data);
        return response.data.recommendations;
      },
      {
        onError: (error) => {
          console.error('Failed to get recommendations:', error);
          throw new Error(error.response?.data?.message || 'Failed to get recommendations');
        }
      }
    );
  };

  // New: Get destination search results
  const useDestinationSearch = (searchQuery, categories) => {
    return useQuery(
      ['destinationSearch', { searchQuery, categories }],
      async () => {
        if (!searchQuery && (!categories || categories.length === 0)) return [];
        const response = await axios.get('/api/destinations/search', {
          params: { query: searchQuery, categories }
        });
        // Change: Extract the destination array from the "data" key
        return response.data.data;
      },
      {
        enabled: !!searchQuery || (categories && categories.length > 0),
      }
    );
  };

  // New: Get destination recommendations
  const useDestinationRecommendations = () => {
    return useQuery(
      'destinationRecommendations',
      async () => {
        const response = await axios.get('/api/destinations/recommendations');
        // Change: Extract the destination array from the "data" key
        return response.data.data;
      },
      {
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
      }
    );
  };

  return {
    useGenerateItinerary,
    useDestinationInsights,
    useActivitySuggestions,
    useOptimizeItinerary,
    useRecommendations,
    useDestinationSearch,
    useDestinationRecommendations,
  };
};

export default useAI;
