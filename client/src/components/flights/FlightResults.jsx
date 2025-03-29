import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Flight as FlightIcon,
  AccessTime as TimeIcon,
  Airlines as AirlinesIcon,
  Compare as CompareIcon,
  Check as CheckIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { format, parseISO, addMinutes } from 'date-fns';
import { formatCurrency } from '../../utils/currencyUtils';

const FlightSegment = ({ segment, isLastSegment }) => {
  const departureTime = parseISO(segment.departure.time);
  const arrivalTime = parseISO(segment.arrival.time);

  return (
    <Box sx={{ mb: isLastSegment ? 0 : 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={5}>
          <Typography variant="h6">
            {format(departureTime, 'HH:mm')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {segment.departure.iataCode}
            {segment.departure.terminal && ` Terminal ${segment.departure.terminal}`}
          </Typography>
        </Grid>

        <Grid item xs={2} sx={{ textAlign: 'center' }}>
          <FlightIcon sx={{ transform: 'rotate(90deg)' }} />
        </Grid>

        <Grid item xs={5}>
          <Typography variant="h6">
            {format(arrivalTime, 'HH:mm')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {segment.arrival.iataCode}
            {segment.arrival.terminal && ` Terminal ${segment.arrival.terminal}`}
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={<AirlinesIcon />}
          label={`${segment.carrierCode} ${segment.flightNumber}`}
        />
        <Chip
          size="small"
          icon={<TimeIcon />}
          label={segment.duration}
        />
      </Box>

      {!isLastSegment && (
        <Divider sx={{ my: 2 }} />
      )}
    </Box>
  );
};

FlightSegment.propTypes = {
  segment: PropTypes.shape({
    departure: PropTypes.shape({
      time: PropTypes.string.isRequired,
      iataCode: PropTypes.string.isRequired,
      terminal: PropTypes.string
    }).isRequired,
    arrival: PropTypes.shape({
      time: PropTypes.string.isRequired,
      iataCode: PropTypes.string.isRequired,
      terminal: PropTypes.string
    }).isRequired,
    carrierCode: PropTypes.string.isRequired,
    flightNumber: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired
  }).isRequired,
  isLastSegment: PropTypes.bool.isRequired
};

const FlightCard = ({ flight, onSelect, onShare, isSelected }) => {
  return (
    <Card 
      sx={{ 
        mb: 2,
        position: 'relative',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider'
      }}
    >
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 1
          }}
        >
          <CheckIcon fontSize="small" />
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="primary">
              {formatCurrency(flight.price.amount, flight.price.currency)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onShare(flight)}
              title="Share flight details"
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Box>
          <Chip
            label={flight.travelClass}
            color="primary"
            variant="outlined"
          />
        </Box>

        {flight.itineraries.map((itinerary, itineraryIndex) => (
          <Box key={itineraryIndex} sx={{ mb: itineraryIndex === 0 ? 2 : 0 }}>
            {itineraryIndex > 0 && (
              <Box sx={{ my: 2 }}>
                <Divider>
                  <Chip label="Return" />
                </Divider>
              </Box>
            )}

            {itinerary.segments.map((segment, segmentIndex) => (
              <FlightSegment
                key={segmentIndex}
                segment={segment}
                isLastSegment={segmentIndex === itinerary.segments.length - 1}
              />
            ))}
          </Box>
        ))}

        <Box sx={{ mt: 2 }}>
          <Button
            variant={isSelected ? "outlined" : "contained"}
            fullWidth
            onClick={() => onSelect(flight)}
            startIcon={isSelected ? <CompareIcon /> : null}
          >
            {isSelected ? 'Selected for Comparison' : 'Select Flight'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

FlightCard.propTypes = {
  flight: PropTypes.shape({
    id: PropTypes.string.isRequired,
    price: PropTypes.shape({
      amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired
    }).isRequired,
    travelClass: PropTypes.string.isRequired,
    itineraries: PropTypes.arrayOf(
      PropTypes.shape({
        segments: PropTypes.arrayOf(PropTypes.object).isRequired
      })
    ).isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired
};

const FlightResults = ({ flights, isLoading, error, onSelectFlight, onShareFlight, selectedFlights = [] }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error.message || 'Failed to load flights. Please try again.'}
      </Alert>
    );
  }

  if (!flights?.length) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No flights found for your search criteria. Please try different dates or airports.
      </Alert>
    );
  }

  return (
    <Box>
      {selectedFlights.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedFlights.length === 1 ? (
            'Select up to 2 more flights to compare'
          ) : selectedFlights.length === 2 ? (
            'Select 1 more flight to compare'
          ) : (
            'Maximum number of flights selected for comparison'
          )}
        </Alert>
      )}
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          onSelect={onSelectFlight}
          onShare={onShareFlight}
          isSelected={selectedFlights.includes(flight.id)}
        />
      ))}
    </Box>
  );
};

FlightResults.propTypes = {
  flights: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onSelectFlight: PropTypes.func.isRequired,
  onShareFlight: PropTypes.func.isRequired,
  selectedFlights: PropTypes.arrayOf(PropTypes.string)
};

FlightResults.defaultProps = {
  flights: [],
  isLoading: false,
  error: null,
  selectedFlights: []
};

export default FlightResults; 