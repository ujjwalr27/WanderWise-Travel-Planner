import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  IconButton,
  CircularProgress,
  Autocomplete,
  Rating,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { useAI } from '../hooks/useAI';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const categories = [
  'Popular',
  'Beach',
  'Mountains',
  'Cities',
  'Cultural',
  'Adventure',
  'Food',
  'Nature',
  'Relaxation'
];

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City
};

const DestinationCard = ({ destination, onFavorite, isFavorite, onClick }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={onClick}>
        <CardMedia
          component="img"
          height="200"
          image={destination.photos?.[0]?.url || '/placeholder-image.jpg'}
          alt={destination.name}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" gutterBottom>
              {destination.name}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(destination);
              }}
            >
              {isFavorite ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            {destination.description}
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Rating value={destination.rating} precision={0.5} readOnly />
            <Typography variant="body2" color="text.secondary">
              {destination.reviewCount} reviews
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {destination.tags?.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
          {destination.bestTimeToVisit && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Best Time to Visit
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {destination.bestTimeToVisit}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(13);

  const { useDestinationSearch, useDestinationRecommendations } = useAI();
  
  const { data: searchResults, isLoading: isSearching } = useDestinationSearch(
    searchQuery,
    selectedCategories
  );

  const { data: recommendations, isLoading: isLoadingRecommendations } = useDestinationRecommendations();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const handleFavorite = (destination) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((fav) => fav.id === destination.id);
      if (isFavorite) {
        return prev.filter((fav) => fav.id !== destination.id);
      }
      return [...prev, destination];
    });
  };

  const handleDestinationClick = (destination) => {
    navigate('/itinerary/new', {
      state: { destination }
    });
  };

  const handleMarkerClick = (destination) => {
    setSelectedMarker(destination);
    setMapCenter({
      lat: destination.coordinates[1],
      lng: destination.coordinates[0]
    });
  };

  useEffect(() => {
    if (searchResults?.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      searchResults.forEach(place => {
        bounds.extend({
          lat: place.coordinates[1],
          lng: place.coordinates[0]
        });
      });
      setMapCenter(bounds.getCenter().toJSON());
      setZoom(12);
    }
  }, [searchResults]);

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading Google Maps. Please check your API key and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Explore Destinations
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover amazing places and start planning your next adventure
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: isSearching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={categories}
              value={selectedCategories}
              onChange={(_, newValue) => setSelectedCategories(newValue)}
              renderInput={(params) => (
                <TextField {...params} placeholder="Filter by category" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} key={option} />
                ))
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Map Section */}
      {isLoaded && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
          >
            {(searchResults || recommendations)?.map((destination) => (
              <Marker
                key={destination.id}
                position={{
                  lat: destination.coordinates[1],
                  lng: destination.coordinates[0]
                }}
                onClick={() => handleMarkerClick(destination)}
              />
            ))}
            {selectedMarker && (
              <InfoWindow
                position={{
                  lat: selectedMarker.coordinates[1],
                  lng: selectedMarker.coordinates[0]
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <Box>
                  <Typography variant="subtitle1">{selectedMarker.name}</Typography>
                  <Typography variant="body2">{selectedMarker.description}</Typography>
                  <Rating value={selectedMarker.rating} precision={0.5} readOnly size="small" />
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </Paper>
      )}

      {/* Results Section */}
      {searchQuery ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Search Results
          </Typography>
          <Grid container spacing={3}>
            {searchResults?.map((destination) => (
              <Grid item xs={12} sm={6} md={4} key={destination.id}>
                <DestinationCard
                  destination={destination}
                  onFavorite={handleFavorite}
                  isFavorite={favorites.some((fav) => fav.id === destination.id)}
                  onClick={() => handleDestinationClick(destination)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Recommended for You
            </Typography>
            <Grid container spacing={3}>
              {recommendations?.map((destination) => (
                <Grid item xs={12} sm={6} md={4} key={destination.id}>
                  <DestinationCard
                    destination={destination}
                    onFavorite={handleFavorite}
                    isFavorite={favorites.some((fav) => fav.id === destination.id)}
                    onClick={() => handleDestinationClick(destination)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom>
              Popular Categories
            </Typography>
            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <Card>
                    <CardActionArea onClick={() => setSelectedCategories([category])}>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <PlaceIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6">{category}</Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Explore;
