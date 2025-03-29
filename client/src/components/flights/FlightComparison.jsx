import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, parseISO } from 'date-fns';

const ComparisonRow = ({ label, flights, getValue, renderValue, tooltip }) => (
  <TableRow>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
      </Box>
    </TableCell>
    {flights.map((flight, index) => (
      <TableCell key={index} align="center">
        {renderValue ? renderValue(getValue(flight)) : getValue(flight)}
      </TableCell>
    ))}
  </TableRow>
);

const FlightComparison = ({ flights }) => {
  if (!flights?.length) return null;

  const getBestPrice = () => {
    const prices = flights.map(f => f.price.amount);
    return Math.min(...prices);
  };

  const getBestDuration = () => {
    const durations = flights.map(f => {
      const segments = f.itineraries[0].segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const start = parseISO(firstSegment.departure.time);
      const end = parseISO(lastSegment.arrival.time);
      return end - start;
    });
    return Math.min(...durations);
  };

  const bestPrice = getBestPrice();
  const bestDuration = getBestDuration();

  const comparisonData = [
    {
      label: 'Price',
      getValue: (flight) => flight.price.amount,
      renderValue: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography>
            {formatCurrency(value, flights[0].price.currency)}
          </Typography>
          {value === bestPrice && (
            <Chip
              size="small"
              color="success"
              icon={<StarIcon />}
              label="Best Price"
            />
          )}
        </Box>
      )
    },
    {
      label: 'Travel Class',
      getValue: (flight) => flight.travelClass,
      renderValue: (value) => (
        <Chip
          size="small"
          label={value}
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      label: 'Departure',
      getValue: (flight) => flight.itineraries[0].segments[0].departure.time,
      renderValue: (value) => format(parseISO(value), 'HH:mm')
    },
    {
      label: 'Arrival',
      getValue: (flight) => {
        const segments = flight.itineraries[0].segments;
        return segments[segments.length - 1].arrival.time;
      },
      renderValue: (value) => format(parseISO(value), 'HH:mm')
    },
    {
      label: 'Duration',
      getValue: (flight) => {
        const segments = flight.itineraries[0].segments;
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];
        const start = parseISO(firstSegment.departure.time);
        const end = parseISO(lastSegment.arrival.time);
        return end - start;
      },
      renderValue: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography>
            {Math.floor(value / (1000 * 60 * 60))}h {Math.floor((value % (1000 * 60 * 60)) / (1000 * 60))}m
          </Typography>
          {value === bestDuration && (
            <Chip
              size="small"
              color="success"
              icon={<StarIcon />}
              label="Fastest"
            />
          )}
        </Box>
      )
    },
    {
      label: 'Stops',
      getValue: (flight) => flight.itineraries[0].segments.length - 1,
      renderValue: (value) => (
        <Chip
          size="small"
          color={value === 0 ? 'success' : value === 1 ? 'warning' : 'error'}
          label={value === 0 ? 'Direct' : `${value} stop${value > 1 ? 's' : ''}`}
        />
      ),
      tooltip: 'Number of stops during the journey'
    }
  ];

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Flight Comparison
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              {flights.map((_, index) => (
                <TableCell key={index} align="center">
                  Option {index + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {comparisonData.map((row, index) => (
              <ComparisonRow
                key={index}
                label={row.label}
                flights={flights}
                getValue={row.getValue}
                renderValue={row.renderValue}
                tooltip={row.tooltip}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

ComparisonRow.propTypes = {
  label: PropTypes.string.isRequired,
  flights: PropTypes.array.isRequired,
  getValue: PropTypes.func.isRequired,
  renderValue: PropTypes.func,
  tooltip: PropTypes.string
};

FlightComparison.propTypes = {
  flights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      price: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        currency: PropTypes.string.isRequired
      }).isRequired,
      travelClass: PropTypes.string.isRequired,
      itineraries: PropTypes.arrayOf(
        PropTypes.shape({
          segments: PropTypes.arrayOf(
            PropTypes.shape({
              departure: PropTypes.shape({
                time: PropTypes.string.isRequired
              }).isRequired,
              arrival: PropTypes.shape({
                time: PropTypes.string.isRequired
              }).isRequired
            })
          ).isRequired
        })
      ).isRequired
    })
  ).isRequired
};

export default FlightComparison; 