import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar
} from '@mui/material';
import { Compare as CompareIcon } from '@mui/icons-material';
import FlightSearchForm from '../../components/flights/FlightSearchForm';
import FlightResults from '../../components/flights/FlightResults';
import FlightPriceHistory from '../../components/flights/FlightPriceHistory';
import FlightComparison from '../../components/flights/FlightComparison';
import ShareFlightDialog from './ShareFlightDialog';
import useFlights from '../../hooks/useFlights';

const FlightSearch = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [selectedFlights, setSelectedFlights] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFlightToShare, setSelectedFlightToShare] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '' });
  const { useFlightSearch } = useFlights();
  const { data: flights, isLoading, error } = useFlightSearch(searchParams);

  const handleSearch = (params) => {
    setSearchParams(params);
    setSelectedFlights([]);
  };

  const handleSelectFlight = (flight) => {
    setSelectedFlights(prev => {
      // If flight is already selected, remove it
      if (prev.some(f => f.id === flight.id)) {
        return prev.filter(f => f.id !== flight.id);
      }
      // Add flight to selection (max 3)
      if (prev.length < 3) {
        return [...prev, flight];
      }
      return prev;
    });
  };

  const handleShareFlight = (flight) => {
    setSelectedFlightToShare(flight);
    setShowShareDialog(true);
  };

  const handleShareSuccess = (email) => {
    setNotification({
      open: true,
      message: `Flight details sent to ${email}`
    });
    setShowShareDialog(false);
  };

  const handleCloseNotification = () => {
    setNotification({ open: false, message: '' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search Flights
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Find the best flights for your journey with real-time pricing and availability.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, position: 'relative' }}>
        {isLoading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12
            }} 
          />
        )}
        <FlightSearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </Paper>

      {searchParams && (
        <>
          {/* Price History */}
          <FlightPriceHistory
            origin={searchParams.origin}
            destination={searchParams.destination}
            departureDate={searchParams.departureDate}
          />

          {/* Flight Results */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Flight Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchParams.origin} → {searchParams.destination}
                  {searchParams.returnDate ? ' (Round Trip)' : ' (One Way)'}
                </Typography>
              </Box>
              {selectedFlights.length > 1 && (
                <Button
                  variant="outlined"
                  startIcon={<CompareIcon />}
                  onClick={() => setShowComparison(true)}
                >
                  Compare {selectedFlights.length} Flights
                </Button>
              )}
            </Box>

            <FlightResults
              flights={flights}
              isLoading={isLoading}
              error={error}
              onSelectFlight={handleSelectFlight}
              onShareFlight={handleShareFlight}
              selectedFlights={selectedFlights.map(f => f.id)}
            />
          </Box>

          {/* Flight Comparison Dialog */}
          <Dialog
            open={showComparison}
            onClose={() => setShowComparison(false)}
            maxWidth="lg"
            fullWidth
            scroll="paper"
          >
            <DialogTitle>
              Flight Comparison
              <Typography variant="body2" color="text.secondary">
                Compare up to 3 flights side by side
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <FlightComparison flights={selectedFlights} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowComparison(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <ShareFlightDialog
            open={showShareDialog}
            onClose={() => setShowShareDialog(false)}
            flight={selectedFlightToShare}
            onSuccess={handleShareSuccess}
          />

          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={handleCloseNotification}
            message={notification.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </>
      )}
    </Container>
  );
};

export default FlightSearch; 