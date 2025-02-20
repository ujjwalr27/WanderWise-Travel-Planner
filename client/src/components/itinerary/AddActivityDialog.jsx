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
  Grid
} from '@mui/material';
import { LoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useItinerary } from '../../hooks/useItinerary';
import { format, isWithinInterval } from 'date-fns';

const libraries = ['places'];

const activityTypes = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'local', label: 'Local Experience' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'transport', label: 'Transportation' },
  { value: 'dining', label: 'Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sightseeing', label: 'Sightseeing' }
];

const AddActivityDialog = ({ open, onClose, itineraryId, dates }) => {
  const [formData, setFormData] = useState({
    date: dates?.startDate ? new Date(dates.startDate) : new Date(),
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
  const { useAddActivity } = useItinerary();
  const addActivityMutation = useAddActivity();

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTimeChange = (field) => (time) => {
    if (time) {
      const timeString = format(time, 'HH:mm');
      setFormData(prev => ({
        ...prev,
        [field]: timeString
      }));
    }
  };

  const onSearchBoxLoad = (ref) => {
    setSearchBox(ref);
  };

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places.length === 0) {
        setError('Please select a valid location');
        return;
      }

      const place = places[0];
      if (!place.geometry) {
        setError('Selected place has no location data');
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: prev.title || place.name, // Only set title if it's empty
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

  const handleDateChange = (newDate) => {
    if (!newDate) return;

    const start = new Date(dates.startDate);
    const end = new Date(dates.endDate);

    if (!isWithinInterval(newDate, { start, end })) {
      setError('Selected date must be within the itinerary dates');
      return;
    }

    setFormData(prev => ({
      ...prev,
      date: newDate
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.type) {
      setError('Please select an activity type');
      return false;
    }
    if (!formData.title) {
      setError('Please enter an activity title');
      return false;
    }
    if (!formData.location.name || !formData.location.address) {
      setError('Please select a valid location');
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Please set both start and end times');
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addActivityMutation.mutateAsync({
        id: itineraryId,
        data: {
          date: formData.date,
          activity: {
            type: formData.type,
            title: formData.title,
            description: formData.description,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location,
            cost: {
              amount: Number(formData.cost.amount),
              currency: formData.cost.currency
            },
            notes: formData.notes
          }
        }
      });

      onClose();
    } catch (error) {
      console.error('Failed to add activity:', error);
      setError(error.response?.data?.message || 'Failed to add activity');
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

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                minDate={new Date(dates.startDate)}
                maxDate={new Date(dates.endDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={formData.type}
                onChange={handleChange('type')}
                label="Activity Type"
              >
                {activityTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={handleChange('title')}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              libraries={['places']}
            >
              <StandaloneSearchBox
                onLoad={onSearchBoxLoad}
                onPlacesChanged={handlePlacesChanged}
              >
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="Search for a place..."
                  required
                  value={formData.location.name}
                  InputProps={{
                    readOnly: true
                  }}
                />
              </StandaloneSearchBox>
            </LoadScript>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="Start Time"
                value={formData.startTime ? new Date(`2000-01-01T${formData.startTime}`) : null}
                onChange={handleTimeChange('startTime')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="End Time"
                value={formData.endTime ? new Date(`2000-01-01T${formData.endTime}`) : null}
                onChange={handleTimeChange('endTime')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cost"
              type="number"
              value={formData.cost.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cost: {
                  ...prev.cost,
                  amount: Number(e.target.value)
                }
              }))}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.cost.currency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cost: {
                    ...prev.cost,
                    currency: e.target.value
                  }
                }))}
                label="Currency"
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={handleChange('description')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleChange('notes')}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={addActivityMutation.isLoading}
        >
          {addActivityMutation.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Add Activity'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddActivityDialog; 