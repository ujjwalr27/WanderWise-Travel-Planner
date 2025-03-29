import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  Paper,
  Grid,
  MenuItem
} from '@mui/material';
import { registerSchema } from '../../utils/validationUtils';
import { useAuth } from '../../context/AuthContext';

const travelStyles = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'budget', label: 'Budget' }
];

const Register = () => {
  const [error, setError] = useState('');
  const { register } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      preferences: {
        travelStyle: 'cultural',
        maxBudget: '',
        preferredDestinations: '',
        dietaryRestrictions: ''
      }
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setError('');
      // Format preferences
      const formattedValues = {
        ...values,
        preferences: {
          ...values.preferences,
          preferredDestinations: values.preferences.preferredDestinations
            ? values.preferences.preferredDestinations.split(',').map(d => d.trim())
            : [],
          dietaryRestrictions: values.preferences.dietaryRestrictions
            ? values.preferences.dietaryRestrictions.split(',').map(d => d.trim())
            : []
        }
      };

      const result = await register(formattedValues);
      if (!result.success) {
        setError(result.error);
      }
    }
  });

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Join AI Travel Agent to start planning your trips
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ width: '100%', mt: 1 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  autoComplete="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Travel Preferences
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="preferences.travelStyle"
                  name="preferences.travelStyle"
                  label="Travel Style"
                  value={formik.values.preferences.travelStyle}
                  onChange={formik.handleChange}
                >
                  {travelStyles.map((style) => (
                    <MenuItem key={style.value} value={style.value}>
                      {style.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="preferences.maxBudget"
                  name="preferences.maxBudget"
                  label="Max Budget (USD)"
                  type="number"
                  value={formik.values.preferences.maxBudget}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="preferences.preferredDestinations"
                  name="preferences.preferredDestinations"
                  label="Preferred Destinations"
                  placeholder="Enter destinations separated by commas"
                  value={formik.values.preferences.preferredDestinations}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="preferences.dietaryRestrictions"
                  name="preferences.dietaryRestrictions"
                  label="Dietary Restrictions"
                  placeholder="Enter restrictions separated by commas"
                  value={formik.values.preferences.dietaryRestrictions}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              Create Account
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 