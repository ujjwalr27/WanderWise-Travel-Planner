import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/currencyUtils';
import useFlights from '../../hooks/useFlights';

const FlightPriceHistory = ({ origin, destination, departureDate }) => {
  const { useFlightPriceMetrics } = useFlights();
  const { data: priceMetrics, isLoading, error } = useFlightPriceMetrics({
    origin,
    destination,
    departureDate
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Unable to load price metrics
      </Alert>
    );
  }

  if (!priceMetrics?.priceMetrics?.length) {
    return null;
  }

  const getQuartileColor = (quartile) => {
    switch (quartile) {
      case 'FIRST':
        return 'success';
      case 'SECOND':
        return 'info';
      case 'THIRD':
        return 'warning';
      case 'FOURTH':
        return 'error';
      default:
        return 'default';
    }
  };

  const getQuartileIcon = (quartile) => {
    switch (quartile) {
      case 'FIRST':
      case 'SECOND':
        return <TrendingDownIcon fontSize="small" />;
      case 'THIRD':
      case 'FOURTH':
        return <TrendingUpIcon fontSize="small" />;
      default:
        return <TimelineIcon fontSize="small" />;
    }
  };

  const getQuartileLabel = (quartile, travelClass) => {
    switch (quartile) {
      case 'FIRST':
        return `Best price for ${travelClass}`;
      case 'SECOND':
        return `Good price for ${travelClass}`;
      case 'THIRD':
        return `Average price for ${travelClass}`;
      case 'FOURTH':
        return `High price for ${travelClass}`;
      default:
        return `Price for ${travelClass}`;
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Price Analysis
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {priceMetrics.priceMetrics.map((metric, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={getQuartileIcon(metric.quartile)}
              label={formatCurrency(metric.amount, priceMetrics.currencyCode)}
              color={getQuartileColor(metric.quartile)}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {getQuartileLabel(metric.quartile, metric.travelClass)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

FlightPriceHistory.propTypes = {
  origin: PropTypes.string.isRequired,
  destination: PropTypes.string.isRequired,
  departureDate: PropTypes.string.isRequired
};

export default FlightPriceHistory; 