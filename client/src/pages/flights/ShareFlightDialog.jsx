import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, parseISO } from 'date-fns';
import axios from 'axios';

const ShareFlightDialog = ({ open, onClose, flight, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/flights/share', {
        email,
        flightDetails: flight
      });
      
      onSuccess(email);
      setEmail('');
    } catch (error) {
      console.error('Failed to send flight details:', error);
      setError(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  if (!flight) return null;

  const firstSegment = flight.itineraries[0].segments[0];
  const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Share Flight Details
        <Typography variant="body2" color="text.secondary">
          Send flight information via email
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Flight Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {firstSegment.departure.iataCode} → {lastSegment.arrival.iataCode}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {formatCurrency(flight.price.amount, flight.price.currency)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {format(parseISO(firstSegment.departure.time), 'MMM d, yyyy')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            disabled={isLoading}
            required
            sx={{ mb: 2 }}
          />
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <EmailIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ShareFlightDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  flight: PropTypes.object,
  onSuccess: PropTypes.func.isRequired
};

export default ShareFlightDialog; 