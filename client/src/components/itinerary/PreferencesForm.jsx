import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  Typography,
  Button,
  InputAdornment
} from '@mui/material';
import { getSupportedCurrencies } from '../../utils/currencyUtils';

const travelStyles = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'budget', label: 'Budget' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxation', label: 'Relaxation' }
];

const interests = [
  'Museums',
  'Art Galleries',
  'Historical Sites',
  'Local Cuisine',
  'Shopping',
  'Nature',
  'Beaches',
  'Hiking',
  'Nightlife',
  'Photography',
  'Architecture',
  'Local Markets',
  'Music',
  'Sports',
  'Wellness'
];

const excludeTypes = [
  'Long Walks',
  'Crowded Places',
  'Public Transportation',
  'Street Food',
  'Adventure Activities',
  'Late Night Activities',
  'Religious Sites',
  'Shopping Centers',
  'Museums'
];

const accessibilityOptions = [
  'Wheelchair Accessible',
  'Limited Mobility',
  'Hearing Impaired',
  'Visually Impaired',
  'Service Animal',
  'No Stairs',
  'Dietary Restrictions'
];

const PreferencesForm = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    travelStyle: initialData.travelStyle || 'cultural',
    budget: {
      planned: initialData.budget?.planned || '',
      currency: initialData.budget?.currency || 'USD'
    },
    interests: initialData.interests || [],
    excludeTypes: initialData.excludeTypes || [],
    accessibility: initialData.accessibility || [],
    dietaryRestrictions: initialData.dietaryRestrictions || []
  });

  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleBudgetChange = (field) => (event) => {
    let value = event.target.value;
    
    // For planned budget, ensure it's a valid number
    if (field === 'planned') {
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^\d.]/g, '');
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setFormData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    setError('');

    // Validate budget
    const budgetAmount = Number(formData.budget.planned);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      setError('Please enter a valid budget amount greater than 0');
      return;
    }

    // Format the data before submission
    const formattedData = {
      travelStyle: String(formData.travelStyle || 'cultural').toLowerCase(),
      budget: {
        planned: budgetAmount,
        currency: String(formData.budget.currency || 'USD').toUpperCase()
      },
      interests: Array.isArray(formData.interests) 
        ? formData.interests.map(interest => String(interest).trim())
        : [],
      excludeTypes: Array.isArray(formData.excludeTypes)
        ? formData.excludeTypes.map(type => String(type).trim())
        : [],
      accessibility: Array.isArray(formData.accessibility)
        ? formData.accessibility.map(item => String(item).trim())
        : [],
      dietaryRestrictions: Array.isArray(formData.dietaryRestrictions)
        ? formData.dietaryRestrictions.map(item => String(item).trim())
        : []
    };

    // Debug log
    console.log('Submitting preferences with data:', formattedData);

    onSubmit(formattedData);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Travel Style"
            value={formData.travelStyle}
            onChange={handleChange('travelStyle')}
          >
            {travelStyles.map((style) => (
              <MenuItem key={style.value} value={style.value}>
                {style.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget.planned}
                onChange={handleBudgetChange('planned')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.budget.currency}
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
                value={formData.budget.currency}
                onChange={handleBudgetChange('currency')}
              >
                {getSupportedCurrencies().map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Interests
          </Typography>
          <Autocomplete
            multiple
            options={interests}
            value={formData.interests}
            onChange={(_, newValue) => {
              setFormData((prev) => ({
                ...prev,
                interests: newValue
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select your interests"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Exclude from Itinerary
          </Typography>
          <Autocomplete
            multiple
            options={excludeTypes}
            value={formData.excludeTypes}
            onChange={(_, newValue) => {
              setFormData((prev) => ({
                ...prev,
                excludeTypes: newValue
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select what to exclude"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Accessibility Requirements
          </Typography>
          <Autocomplete
            multiple
            options={accessibilityOptions}
            value={formData.accessibility}
            onChange={(_, newValue) => {
              setFormData((prev) => ({
                ...prev,
                accessibility: newValue
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select accessibility requirements"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Dietary Restrictions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Enter any dietary restrictions (e.g., vegetarian, gluten-free, allergies)"
            value={formData.dietaryRestrictions.join(', ')}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                dietaryRestrictions: e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              }));
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.budget.planned}
            >
              Generate Itinerary
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PreferencesForm; 