import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useLoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { useAI } from '../../hooks/useAI';
import { isValidDateRange } from '../../utils/dateUtils';

const libraries = ['places'];

const DestinationForm = ({ initialData = { destination: null, dates: {} }, onSubmit }) => {
  const [destination, setDestination] = useState(initialData.destination || null);
  const [startDate, setStartDate] = useState(initialData.dates.startDate || null);
  const [endDate, setEndDate] = useState(initialData.dates.endDate || null);
  const [searchBox, setSearchBox] = useState(null);
  const [error, setError] = useState(null);

  const { useDestinationInsights } = useAI();
  const { data: insights, isLoading: insightsLoading } = useDestinationInsights(
    destination ? {
      city: destination.city,
      country: destination.country
    } : null
  );

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const onSearchBoxLoad = (ref) => {
    setSearchBox(ref);
  };

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      
      if (places.length === 0) {
        setError('No places found. Please try a different search.');
        return;
      }

      const place = places[0];
      if (!place.geometry) {
        setError('Place has no location data. Please try a different search.');
        return;
      }

      // Extract city and country from address components
      let city = '';
      let country = '';
      
      place.address_components.forEach(component => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
        // Fallback for cities without locality
        else if (!city && component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
      });

      if (!city || !country) {
        setError('Could not determine city or country. Please try a more specific location.');
        return;
      }

      const newDestination = {
        city,
        country,
        coordinates: [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ],
        placeId: place.place_id,
        formattedAddress: place.formatted_address
      };

      setDestination(newDestination);
      setError(null);
    }
  };

  useEffect(() => {
    if (destination && startDate && endDate && isValidDateRange(startDate, endDate)) {
      onSubmit({
        destination,
        dates: {
          startDate,
          endDate
        }
      });
    }
  }, [destination, startDate, endDate, onSubmit]);

  if (loadError) {
    return (
      <Alert severity="error">
        Error loading Google Maps. Please check your API key and try again.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {error && (
          <Grid item xs={12}>
            <Alert severity="warning" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={handlePlacesChanged}
          >
            <TextField
              fullWidth
              placeholder="Search for a destination..."
              defaultValue={destination?.formattedAddress || ''}
              InputProps={{
                type: 'search'
              }}
            />
          </StandaloneSearchBox>
          {destination && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Selected: {destination.city}, {destination.country}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDate={new Date()}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDate={startDate || new Date()}
            />
          </LocalizationProvider>
        </Grid>

        {destination && insights && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Destination Insights
              </Typography>
              {insightsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Best Time to Visit
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.bestTimeToVisit}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Local Customs
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.localCustoms}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Transportation
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.transportation}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DestinationForm; 