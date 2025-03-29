

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Collapse,
  Paper,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

const ActivityCard = ({ activity }) => {
  const [expanded, setExpanded] = useState(false);

  if (!activity) return null;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {activity.title}
            </Typography>
            <Chip
              size="small"
              label={activity.type}
              sx={{ mr: 1, mb: 1 }}
            />
            {activity.cost?.amount && (
              <Chip
                size="small"
                icon={<MoneyIcon />}
                label={formatCurrency(activity.cost.amount, activity.cost.currency)}
                sx={{ mb: 1 }}
              />
            )}
          </Box>
          <IconButton onClick={toggleExpanded} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TimeIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
          </Typography>
        </Box>

        {activity.location && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {activity.location.name}
            </Typography>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" paragraph>
              {activity.description}
            </Typography>
            {activity.notes && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.notes}
                </Typography>
              </>
            )}
            {activity.location?.address && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.location.address}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const DayPlan = ({ day, index }) => {
  if (!day) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Day {index + 1} - {formatDate(day.date)}
      </Typography>
      {day.notes && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {day.notes}
        </Typography>
      )}
      {day.activities?.map((activity, i) => (
        <ActivityCard key={i} activity={activity} />
      ))}
    </Box>
  );
};

const GeneratedItinerary = ({ itinerary, isLoading, error }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error.message || 'Failed to generate itinerary. Please try again.'}
        </Alert>
      </Box>
    );
  }

  if (!itinerary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No itinerary data available. Please generate an itinerary first.
        </Alert>
      </Box>
    );
  }

  const destination = itinerary.destination || {};
  const budget = itinerary.budget || {};

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            {itinerary.title || 'Your Travel Itinerary'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {destination.city && destination.country ? 
              `${destination.city}, ${destination.country}` : 
              'Destination not specified'}
          </Typography>
          <Box sx={{ mb: 3 }}>
            {itinerary.travelStyle && (
              <Chip
                label={itinerary.travelStyle}
                sx={{ mr: 1 }}
              />
            )}
            {budget.planned && budget.currency && (
              <Chip
                icon={<MoneyIcon />}
                label={formatCurrency(budget.planned, budget.currency)}
              />
            )}
          </Box>
        </Grid>

        {itinerary.tips?.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Travel Tips
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {itinerary.tips.map((tip, index) => (
                  <Typography key={index} component="li" variant="body2" paragraph>
                    {tip}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Divider sx={{ mb: 3 }} />
          {itinerary.dayPlans?.map((day, index) => (
            <DayPlan key={index} day={day} index={index} />
          )) || (
            <Alert severity="info">
              No day plans available yet.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneratedItinerary; 