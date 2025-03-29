import {
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import {
  FlightTakeoff as FlightIcon,
  Update as UpdateIcon,
  Share as ShareIcon,
  WbSunny as WeatherIcon,
  Event as EventIcon,
  AccountBalance as BudgetIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'ITINERARY_SHARED':
        return <ShareIcon color="primary" />;
      case 'ITINERARY_UPDATED':
        return <UpdateIcon color="info" />;
      case 'TRAVEL_REMINDER':
        return <FlightIcon color="success" />;
      case 'WEATHER_ALERT':
        return <WeatherIcon color="warning" />;
      case 'ACTIVITY_REMINDER':
        return <EventIcon color="secondary" />;
      case 'BUDGET_ALERT':
        return <BudgetIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  const getBackgroundColor = () => {
    if (!notification.read) {
      return 'action.hover';
    }
    return 'transparent';
  };

  return (
    <MenuItem
      onClick={onClick}
      sx={{
        py: 2,
        px: 3,
        bgcolor: getBackgroundColor(),
        '&:hover': {
          bgcolor: 'action.selected'
        }
      }}
    >
      <ListItemIcon>
        {getIcon()}
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: notification.read ? 'normal' : 'bold',
              color: notification.read ? 'text.secondary' : 'text.primary'
            }}
          >
            {notification.title}
          </Typography>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {notification.message}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
        }
      />
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{
          opacity: 0,
          transition: 'opacity 0.2s',
          '.MuiMenuItem-root:hover &': {
            opacity: 1
          }
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </MenuItem>
  );
};

export default NotificationItem; 