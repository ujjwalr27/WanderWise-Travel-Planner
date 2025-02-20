import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  Place as PlaceIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateUtils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultOptions = {
  scrollwheel: true,
  zoomControl: true,
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: true,
};

const ItineraryMap = ({ itinerary, activities, onActivityClick }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [center, setCenter] = useState({
    lat: itinerary?.destination?.coordinates[1] || 0,
    lng: itinerary?.destination?.coordinates[0] || 0
  });
  const [zoom, setZoom] = useState(12);

  // Calculate bounds for all activities
  const fitBounds = useCallback(() => {
    if (!activities?.length || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    activities.forEach(activity => {
      bounds.extend({
        lat: activity.location.coordinates[1],
        lng: activity.location.coordinates[0]
      });
    });

    return bounds;
  }, [activities]);

  // Fit map to show all activities
  useEffect(() => {
    if (isLoaded && activities?.length) {
      const bounds = fitBounds();
      if (bounds) {
        setCenter({
          lat: bounds.getCenter().lat(),
          lng: bounds.getCenter().lng()
        });
      }
    }
  }, [isLoaded, activities, fitBounds]);

  const getMarkerColor = (activityType) => {
    const colors = {
      'Sightseeing': '#FF5733',
      'Food & Dining': '#33FF57',
      'Cultural': '#5733FF',
      'Adventure': '#FF3333',
      'Shopping': '#33FFFF',
      'Entertainment': '#FFFF33',
      'Transportation': '#808080',
      'Accommodation': '#FF33FF',
      'Relaxation': '#33FF33'
    };
    return colors[activityType] || '#808080';
  };

  if (loadError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          Error loading Google Maps. Please check your API key and try again.
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={defaultOptions}
        onLoad={(map) => {
          const bounds = fitBounds();
          if (bounds) {
            map.fitBounds(bounds, { padding: 50 });
          }
        }}
      >
        {activities?.map((activity, index) => (
          <Marker
            key={index}
            position={{
              lat: activity.location.coordinates[1],
              lng: activity.location.coordinates[0]
            }}
            onClick={() => setSelectedActivity(activity)}
            label={{
              text: (index + 1).toString(),
              color: 'white'
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: getMarkerColor(activity.type),
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              scale: 15
            }}
          />
        ))}

        {selectedActivity && (
          <InfoWindow
            position={{
              lat: selectedActivity.location.coordinates[1],
              lng: selectedActivity.location.coordinates[0]
            }}
            onCloseClick={() => setSelectedActivity(null)}
          >
            <Paper sx={{ p: 2, maxWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedActivity.title}
                </Typography>
              </Box>

              <Chip
                label={selectedActivity.type}
                size="small"
                sx={{ mb: 1 }}
              />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PlaceIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={selectedActivity.location.name}
                    secondary={selectedActivity.location.address}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Time"
                    secondary={`${formatDateTime(selectedActivity.startTime)} - ${formatDateTime(selectedActivity.endTime)}`}
                  />
                </ListItem>
              </List>

              {selectedActivity.description && (
                <Typography variant="body2" color="text.secondary">
                  {selectedActivity.description}
                </Typography>
              )}
            </Paper>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
};

export default ItineraryMap; 