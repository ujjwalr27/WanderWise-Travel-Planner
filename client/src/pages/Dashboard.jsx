import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useItinerary } from '../hooks/useItinerary';
import { useAI } from '../hooks/useAI';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';
import ShareItineraryDialog from '../components/itinerary/ShareItineraryDialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeItinerary, setActiveItinerary] = useState(null);

  const { useItineraries, useDeleteItinerary } = useItinerary();
  const { data: itineraries, isLoading, error } = useItineraries();
  const deleteItineraryMutation = useDeleteItinerary();

  const handleMenuClick = (event, itinerary) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveItinerary(itinerary);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveItinerary(null);
  };

  const handleShare = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async (itineraryId) => {
    try {
      await deleteItineraryMutation.mutateAsync(itineraryId);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      confirmed: 'success',
      'in-progress': 'primary',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={40} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="rectangular" height={100} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load itineraries. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Itineraries
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/itinerary/new')}
        >
          Create New Itinerary
        </Button>
      </Box>

      <Grid container spacing={3}>
        {itineraries?.map((itinerary) => (
          <Grid item xs={12} md={4} key={itinerary._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {itinerary.title}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, itinerary)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {itinerary.destination.city}, {itinerary.destination.country}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Chip
                    label={itinerary.status}
                    color={getStatusColor(itinerary.status)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={itinerary.travelStyle}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Budget: {formatCurrency(itinerary.budget.planned, itinerary.budget.currency)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/itinerary/${itinerary._id}`)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleShare(activeItinerary)}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(activeItinerary?._id)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <ShareItineraryDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        itinerary={selectedItinerary}
      />
    </Box>
  );
};

export default Dashboard; 