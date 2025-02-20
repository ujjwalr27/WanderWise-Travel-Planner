import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { useItinerary } from '../../hooks/useItinerary';

const ShareItineraryDialog = ({ open, onClose, itinerary }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { useShareItinerary } = useItinerary();
  const shareItineraryMutation = useShareItinerary();

  const handleShare = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      await shareItineraryMutation.mutateAsync({
        id: itinerary._id,
        email
      });
      setSuccess(true);
      setError('');
      setEmail('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to share itinerary');
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Itinerary</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {itinerary?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Share this itinerary with other users by entering their email address.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Itinerary shared successfully!
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Email Address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(error)}
          disabled={success}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!email || success || shareItineraryMutation.isLoading}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareItineraryDialog; 