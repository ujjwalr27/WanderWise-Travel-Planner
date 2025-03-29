import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

const useFlights = () => {
  // Search flights
  const useFlightSearch = (params) => {
    return useQuery(
      ['flights', params],
      async () => {
        if (!params?.origin || !params?.destination || !params?.departureDate) {
          return null;
        }
        const response = await axios.get('/api/flights/search', { params });
        return response.data.data;
      },
      {
        enabled: !!(params?.origin && params?.destination && params?.departureDate),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      }
    );
  };

  // Search airports
  const useAirportSearch = (keyword) => {
    return useQuery(
      ['airports', keyword],
      async () => {
        if (!keyword || keyword.length < 2) return [];
        const response = await axios.get('/api/flights/airports/search', {
          params: { keyword }
        });
        return response.data.data;
      },
      {
        enabled: !!(keyword && keyword.length >= 2),
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
      }
    );
  };

  // Get flight price metrics
  const useFlightPriceMetrics = (params) => {
    return useQuery(
      ['flightPrices', params],
      async () => {
        if (!params?.origin || !params?.destination) {
          return null;
        }
        const response = await axios.get('/api/flights/prices', { params });
        return response.data.data;
      },
      {
        enabled: !!(params?.origin && params?.destination),
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
      }
    );
  };

  return {
    useFlightSearch,
    useAirportSearch,
    useFlightPriceMetrics
  };
};

export default useFlights; 