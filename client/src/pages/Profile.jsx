import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  Chip,
  Alert,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { getSupportedCurrencies } from '../utils/currencyUtils';
import { authApi } from '../services/api';

const travelStyles = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'budget', label: 'Budget' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxation', label: 'Relaxation' }
];

const currencies = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' }
];

// Initial preferences state
const initialPreferences = {
  travelStyle: 'cultural',
  maxBudget: '',
  defaultCurrency: 'USD',
  interests: [],
  dietaryRestrictions: [],
  accessibility: [],
  preferredDestinations: ''
};

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  currentPassword: yup.string().min(8, 'Password must be at least 8 characters'),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword'), null], 'Passwords must match')
});

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);

  // Update preferences when user data is available
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        travelStyle: user.preferences.travelStyle || 'cultural',
        maxBudget: user.preferences.maxBudget || '',
        defaultCurrency: user.preferences.currency || 'USD',
        interests: Array.isArray(user.preferences.interests) ? user.preferences.interests : [],
        dietaryRestrictions: Array.isArray(user.preferences.dietaryRestrictions) ? user.preferences.dietaryRestrictions : [],
        accessibility: Array.isArray(user.preferences.accessibility) ? user.preferences.accessibility : [],
        preferredDestinations: Array.isArray(user.preferences.preferredDestinations) 
          ? user.preferences.preferredDestinations.join(', ') 
          : ''
      });
    }
  }, [user]);

  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: handleSubmit
  });

  const handleChange = (field) => (event) => {
    if (field.includes('preferences.')) {
      const prefField = field.split('.')[1];
      setPreferences(prev => ({
        ...prev,
        [prefField]: event.target.value
      }));
    } else {
      formik.handleChange(event);
    }
  };

  async function handleSubmit(values) {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Handle password change first if provided
      if (values.currentPassword && values.newPassword) {
        try {
          const passwordChangeResult = await authApi.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          });
          
          if (!passwordChangeResult.data.status === 'success') {
            throw new Error(passwordChangeResult.data.message || 'Failed to update password');
          }
        } catch (passwordError) {
          setError(passwordError.response?.data?.message || 'Failed to update password');
          setLoading(false);
          return;
        }
      }

      // Handle profile update
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        preferences: {
          travelStyle: preferences.travelStyle,
          maxBudget: Number(preferences.maxBudget) || 0,
          currency: preferences.defaultCurrency,
          interests: preferences.interests,
          dietaryRestrictions: preferences.dietaryRestrictions,
          accessibility: preferences.accessibility,
          preferredDestinations: preferences.preferredDestinations
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        }
      };

      const result = await updateProfile(profileData);
      
      if (result.success) {
        setSuccess('Profile updated successfully' + (values.currentPassword ? ' and password changed' : ''));
        // Reset password fields
        formik.setFieldValue('currentPassword', '');
        formik.setFieldValue('newPassword', '');
        formik.setFieldValue('confirmPassword', '');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{ 
              width: 100, 
              height: 100, 
              mr: 3,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Profile Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your account settings and travel preferences
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="h6" gutterBottom>
            Travel Preferences
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Travel Style"
                value={preferences.travelStyle}
                onChange={handleChange('preferences.travelStyle')}
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
                    label="Maximum Budget"
                    type="number"
                    value={preferences.maxBudget}
                    onChange={handleChange('preferences.maxBudget')}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    select
                    fullWidth
                    label="Currency"
                    value={preferences.defaultCurrency}
                    onChange={handleChange('preferences.defaultCurrency')}
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
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={preferences.interests}
                onChange={(_, newValue) => {
                  setPreferences(prev => ({
                    ...prev,
                    interests: newValue || []
                  }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Travel Interests"
                    placeholder="Add interests"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={preferences.dietaryRestrictions}
                onChange={(_, newValue) => {
                  setPreferences(prev => ({
                    ...prev,
                    dietaryRestrictions: newValue || []
                  }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Dietary Restrictions"
                    placeholder="Add restrictions"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={preferences.accessibility}
                onChange={(_, newValue) => {
                  setPreferences(prev => ({
                    ...prev,
                    accessibility: newValue || []
                  }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Accessibility Requirements"
                    placeholder="Add requirements"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preferred Destinations"
                placeholder="Enter destinations separated by commas"
                value={preferences.preferredDestinations}
                onChange={handleChange('preferences.preferredDestinations')}
                helperText="Example: Paris, Tokyo, New York"
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="currentPassword"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
                helperText={formik.touched.currentPassword && formik.errors.currentPassword}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="newPassword"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                helperText={formik.touched.newPassword && formik.errors.newPassword}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Save Changes
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile; 