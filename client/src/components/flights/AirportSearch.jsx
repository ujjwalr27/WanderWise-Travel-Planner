import { useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import useFlights from '../../hooks/useFlights';

const AirportSearch = ({ 
  label = 'Airport',
  value,
  onChange,
  error,
  helperText,
  required = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { useAirportSearch } = useFlights();
  const { data: airports, isLoading } = useAirportSearch(searchQuery);

  const handleInputChange = (_, newInputValue) => {
    setSearchQuery(newInputValue);
  };

  const handleChange = (_, newValue) => {
    onChange?.(newValue);
  };

  const getOptionLabel = (option) => {
    if (!option) return '';
    return `${option.iataCode} - ${option.name} (${option.cityName}, ${option.countryName})`;
  };

  const renderOption = (props, option) => (
    <Box component="li" {...props}>
      <Box>
        <Typography variant="subtitle2">
          {option.iataCode} - {option.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {option.cityName}, {option.countryName}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      onInputChange={handleInputChange}
      options={airports || []}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      loading={isLoading}
      filterOptions={(x) => x} // Disable built-in filtering
      isOptionEqualToValue={(option, value) => option.iataCode === value.iataCode}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

export default AirportSearch; 