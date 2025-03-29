import { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  Box,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';

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

const ItineraryMap = ({ itinerary }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [center, setCenter] = useState({
    lat: itinerary?.destination?.coordinates[1] || 0,
    lng: itinerary?.destination?.coordinates[0] || 0
  });
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (itinerary?.destination?.coordinates) {
      setCenter({
        lat: itinerary.destination.coordinates[1],
        lng: itinerary.destination.coordinates[0]
      });
    }
  }, [itinerary]);

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading maps
        </Typography>
      </Box>
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
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={defaultOptions}
    >
      <Marker
        position={center}
        title={itinerary?.destination?.city}
      />
    </GoogleMap>
  );
};

export default ItineraryMap; 