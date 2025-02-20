import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { LoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, startOfDay } from 'date-fns';
import { useItinerary } from '../../hooks/useItinerary';

const libraries = ['places'];

const activityTypes = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'local', label: 'Local Experience' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'transport', label: 'Transportation' },
  { value: 'dining', label: 'Food & Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sightseeing', label: 'Sightseeing' }
];

const AddActivityDialog = ({ open, onClose, itineraryId, dates }) => {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    startTime: null,
    endTime: null,
    location: {
      name: '',
      address: '',
      coordinates: [0, 0],
      placeId: ''
    },
    cost: {
      amount: 0,
      currency: 'USD'
    },
    notes: ''
  });
  const [searchBox, setSearchBox] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { useAddActivity } = useItinerary();
  const addActivityMutation = useAddActivity();

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTimeChange = (field) => (time) => {
    setFormData(prev => ({
      ...prev,
      [field]: time ? format(time, 'HH:mm') : null
    }));
  };

  const onSearchBoxLoad = (ref) => {
    setSearchBox(ref);
  };

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      
      if (places.length === 0) {
        setError('Please select a valid location from the suggestions');
        return;
      }

      const place = places[0];
      if (!place.geometry) {
        setError('Selected place has no location data');
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: place.name,
        location: {
          name: place.name,
          address: place.formatted_address,
          coordinates: [
            place.geometry.location.lng(),
            place.geometry.location.lat()
          ],
          placeId: place.place_id
        }
      }));
      setError('');
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Validate required fields
      if (!formData.type || !formData.title || !formData.startTime || !formData.endTime) {
        throw new Error('Please fill in all required fields');
      }

      // Validate location
      if (!formData.location.name || !formData.location.coordinates[0] || !formData.location.coordinates[1]) {
        throw new Error('Please select a valid location from the suggestions');
      }

      // Format the activity data
      const activityData = {
        dayIndex: 0, // This will be calculated on the server based on the date
        activity: {
          type: formData.type.toLowerCase(),
          title: formData.title.trim(),
          description: formData.description.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: {
            name: formData.location.name.trim(),
            address: formData.location.address.trim(),
            coordinates: formData.location.coordinates.map(coord => Number(coord)),
            placeId: formData.location.placeId
          },
          cost: {
            amount: Number(formData.cost.amount) || 0,
            currency: formData.cost.currency.toUpperCase()
          },
          notes: formData.notes.trim()
        }
      };

      // Add activity
      await addActivityMutation.mutateAsync({
        id: itineraryId,
        data: activityData
      });

      onClose();
    } catch (error) {
      console.error('Failed to add activity:', error);
      setError(error.response?.data?.message || error.message || 'Failed to add activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Activity</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Activity Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Activity Type"
              required
            >
              {activityTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
          >
            <StandaloneSearchBox
              onLoad={onSearchBoxLoad}
              onPlacesChanged={handlePlacesChanged}
            >
              <TextField
                fullWidth
                label="Search Location"
                placeholder="Type to search for a place..."
                required
              />
            </StandaloneSearchBox>
          </LoadScript>

          {formData.location.name && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Location
              </Typography>
              <Typography variant="body2">
                {formData.location.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.location.address}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            required
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={formData.startTime ? parse(formData.startTime, 'HH:mm', new Date()) : null}
                onChange={handleTimeChange('startTime')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
              <TimePicker
                label="End Time"
                value={formData.endTime ? parse(formData.endTime, 'HH:mm', new Date()) : null}
                onChange={handleTimeChange('endTime')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Box>
          </LocalizationProvider>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="number"
              label="Cost"
              value={formData.cost.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cost: { ...prev.cost, amount: Number(e.target.value) }
              }))}
              InputProps={{ inputProps: { min: 0 } }}
              fullWidth
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.cost.currency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cost: { ...prev.cost, currency: e.target.value }
                }))}
                label="Currency"
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={handleChange('notes')}
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Add Activity
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddActivityDialog; 