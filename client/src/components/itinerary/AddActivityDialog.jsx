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
  Alert
} from '@mui/material';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';

const libraries = ['places'];

const activityTypes = [
  'cultural',
  'local',
  'relaxation',
  'transport',
  'dining',
  'shopping',
  'entertainment',
  'sightseeing'
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

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

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          location: {
            name: place.name || '',
            address: place.formatted_address || '',
            coordinates: [
              place.geometry.location.lng(),
              place.geometry.location.lat()
            ],
            placeId: place.place_id
          }
        }));
      }
    }
  };

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
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

      const response = await fetch(`/api/itineraries/${itineraryId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add activity');
      }

      onClose();
    } catch (error) {
      setError(error.message);
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
                <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            required
          />

          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
          >
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={handlePlaceSelect}
            >
              <TextField
                fullWidth
                label="Location"
                value={formData.location.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, name: e.target.value }
                }))}
                required
                placeholder="Search for a location"
              />
            </Autocomplete>
          </LoadScript>

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