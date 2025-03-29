import { useState } from 'react';
import {
  Box,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AirportSearch from './AirportSearch';

const travelClasses = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' }
];

const FlightSearchForm = ({ onSearch, isLoading }) => {
  const [formData, setFormData] = useState({
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    adults: 1,
    travelClass: 'ECONOMY'
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.origin) {
      newErrors.origin = 'Origin airport is required';
    }
    if (!formData.destination) {
      newErrors.destination = 'Destination airport is required';
    }
    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    }
    if (formData.returnDate && formData.departureDate > formData.returnDate) {
      newErrors.returnDate = 'Return date must be after departure date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSearch({
        ...formData,
        origin: formData.origin.iataCode,
        destination: formData.destination.iataCode,
        departureDate: formData.departureDate.toISOString().split('T')[0],
        returnDate: formData.returnDate?.toISOString().split('T')[0]
      });
    }
  };

  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <AirportSearch
            label="From"
            value={formData.origin}
            onChange={handleChange('origin')}
            error={!!errors.origin}
            helperText={errors.origin}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <AirportSearch
            label="To"
            value={formData.destination}
            onChange={handleChange('destination')}
            error={!!errors.destination}
            helperText={errors.destination}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Departure Date"
              value={formData.departureDate}
              onChange={handleChange('departureDate')}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.departureDate,
                  helperText: errors.departureDate
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Return Date (Optional)"
              value={formData.returnDate}
              onChange={handleChange('returnDate')}
              minDate={formData.departureDate || new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.returnDate,
                  helperText: errors.returnDate
                }
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Number of Passengers</InputLabel>
            <Select
              value={formData.adults}
              onChange={(e) => handleChange('adults')(e.target.value)}
              label="Number of Passengers"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Travel Class</InputLabel>
            <Select
              value={formData.travelClass}
              onChange={(e) => handleChange('travelClass')(e.target.value)}
              label="Travel Class"
            >
              {travelClasses.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search Flights'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FlightSearchForm; 