import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  Alert,
  Autocomplete,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useItinerary } from '../../hooks/useItinerary';
import { formatCurrency } from '../../utils/currencyUtils';

const activityTypes = [
  'Sightseeing',
  'Food & Dining',
  'Cultural',
  'Adventure',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Accommodation',
  'Relaxation'
];

const AddActivityDialog = ({ open, onClose, itineraryId, dates }) => {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    startTime: null,
    endTime: null,
    location: null,
    description: '',
    cost: {
      amount: '',
      currency: 'USD'
    },
    notes: '',
    bookingInfo: {
      provider: '',
      confirmationNumber: ''
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const { useAddActivity, useNearbySearch } = useItinerary();
  const addActivityMutation = useAddActivity();

  const { data: nearbyPlaces, isLoading: isLoadingPlaces } = useNearbySearch({
    query: searchQuery,
    latitude: formData.location?.coordinates[1],
    longitude: formData.location?.coordinates[0]
  });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCostChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      cost: {
        ...prev.cost,
        [field]: event.target.value
      }
    }));
  };

  const handleBookingChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      bookingInfo: {
        ...prev.bookingInfo,
        [field]: event.target.value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.type || !formData.startTime || !formData.endTime || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await addActivityMutation.mutateAsync({
        id: itineraryId,
        data: formData
      });
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add activity');
    }
  };

  const handleClose = () => {
    setFormData({
      type: '',
      title: '',
      startTime: null,
      endTime: null,
      location: null,
      description: '',
      cost: {
        amount: '',
        currency: 'USD'
      },
      notes: '',
      bookingInfo: {
        provider: '',
        confirmationNumber: ''
      }
    });
    setError('');
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Activity</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Activity Type"
                value={formData.type}
                onChange={handleChange('type')}
                required
              >
                {activityTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                value={formData.location}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    location: newValue
                  }));
                }}
                inputValue={searchQuery}
                onInputChange={(_, newInputValue) => {
                  setSearchQuery(newInputValue);
                }}
                options={nearbyPlaces || []}
                getOptionLabel={(option) => option.name}
                loading={isLoadingPlaces}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingPlaces ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    startTime: newValue
                  }));
                }}
                minDateTime={dates.startDate}
                maxDateTime={dates.endDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    endTime: newValue
                  }));
                }}
                minDateTime={formData.startTime || dates.startDate}
                maxDateTime={dates.endDate}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Cost
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={formData.cost.amount}
                    onChange={handleCostChange('amount')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {formData.cost.currency}
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    select
                    fullWidth
                    label="Currency"
                    value={formData.cost.currency}
                    onChange={handleCostChange('currency')}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Booking Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Provider"
                    value={formData.bookingInfo.provider}
                    onChange={handleBookingChange('provider')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirmation Number"
                    value={formData.bookingInfo.confirmationNumber}
                    onChange={handleBookingChange('confirmationNumber')}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={addActivityMutation.isLoading}
          >
            Add Activity
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddActivityDialog; 