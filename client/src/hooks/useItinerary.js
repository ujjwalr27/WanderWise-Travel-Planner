import { useQuery, useMutation, useQueryClient } from 'react-query';
import { itineraryApi } from '../services/api';

export const useItinerary = () => {
  const queryClient = useQueryClient();

  // Get all itineraries
  const useItineraries = (params) => {
    return useQuery(
      ['itineraries', params],
      () => itineraryApi.getAll(params),
      {
        select: (data) => data.data.itineraries
      }
    );
  };

  // Get single itinerary
  const useItineraryDetails = (id) => {
    return useQuery(
      ['itinerary', id],
      () => itineraryApi.getById(id),
      {
        enabled: !!id,
        select: (data) => data.data.itinerary
      }
    );
  };

  // Create itinerary
  const useCreateItinerary = () => {
    return useMutation(
      async (data) => {
        try {
          // Format dates to ISO strings and ensure all data is properly formatted
          const formattedData = {
            ...data,
            startDate: new Date(data.startDate).toISOString(),
            endDate: new Date(data.endDate).toISOString(),
            budget: {
              planned: Number(data.budget.planned),
              currency: String(data.budget.currency).toUpperCase()
            },
            travelStyle: String(data.travelStyle).toLowerCase(),
            dayPlans: data.dayPlans.map(day => ({
              ...day,
              date: new Date(day.date).toISOString(),
              activities: day.activities.map(activity => ({
                ...activity,
                type: String(activity.type).toLowerCase(),
                cost: {
                  amount: Number(activity.cost.amount),
                  currency: String(activity.cost.currency).toUpperCase()
                },
                location: {
                  ...activity.location,
                  coordinates: activity.location.coordinates.map(coord => Number(coord))
                }
              }))
            })),
            preferences: {
              interests: Array.isArray(data.preferences?.interests) ? 
                data.preferences.interests.map(String) : [],
              accessibility: Array.isArray(data.preferences?.accessibility) ? 
                data.preferences.accessibility.map(String) : [],
              dietaryRestrictions: Array.isArray(data.preferences?.dietaryRestrictions) ? 
                data.preferences.dietaryRestrictions.map(String) : []
            }
          };

          console.log('Creating itinerary with data:', formattedData);
          const response = await itineraryApi.create(formattedData);
          
          if (!response.data || !response.data.itinerary) {
            throw new Error('Invalid response format from server');
          }
          
          return response.data.itinerary;
        } catch (error) {
          console.error('Create itinerary error:', error);
          
          // If the error response contains an itinerary, assume it was created successfully
          if (error.response?.data?.itinerary) {
            return error.response.data.itinerary;
          }
          
          // Handle validation errors from the server
          if (error.response?.data?.details) {
            const details = Object.entries(error.response.data.details)
              .map(([field, message]) => 
                `${field}: ${typeof message === 'object' ? JSON.stringify(message) : message}`
              )
              .join(', ');
            throw new Error(`Validation failed: ${details}`);
          }
          
          // Handle array validation errors
          if (error.response?.data?.error === 'Validation Error' && 
              error.response.data.message?.includes('[object Object]')) {
            const errorDetails = error.response.data.details;
            if (errorDetails) {
              const errorMessage = typeof errorDetails === 'object' 
                ? Object.values(errorDetails)
                    .map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg)
                    .join(', ')
                : errorDetails;
              throw new Error(`Validation error: ${errorMessage}`);
            }
          }
          
          // Handle other server errors
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          }
          
          // Handle network or other errors
          throw new Error(error.message || 'Failed to create itinerary');
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('itineraries');
        }
      }
    );
  };

  // Update itinerary
  const useUpdateItinerary = () => {
    return useMutation(
      ({ id, data }) => itineraryApi.update(id, data),
      {
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries(['itinerary', variables.id]);
          queryClient.invalidateQueries('itineraries');
        }
      }
    );
  };

  // Delete itinerary
  const useDeleteItinerary = () => {
    return useMutation(
      (id) => itineraryApi.delete(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries('itineraries');
        }
      }
    );
  };

  // Share itinerary
  const useShareItinerary = () => {
    return useMutation(
      ({ id, email }) => itineraryApi.share(id, email),
      {
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries(['itinerary', variables.id]);
        }
      }
    );
  };

  // Search nearby places
  const useNearbySearch = (params) => {
    return useQuery(
      ['nearby', params],
      () => itineraryApi.searchNearby(params),
      {
        enabled: !!params?.latitude && !!params?.longitude,
        select: (data) => data.data.places
      }
    );
  };

  return {
    useItineraries,
    useItineraryDetails,
    useCreateItinerary,
    useUpdateItinerary,
    useDeleteItinerary,
    useShareItinerary,
    useNearbySearch
  };
};

export default useItinerary;
