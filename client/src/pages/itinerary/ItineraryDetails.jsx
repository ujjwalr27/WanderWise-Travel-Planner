import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs
} from '@mui/material';
import {
  Edit as EditIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Map as MapIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useItinerary } from '../../hooks/useItinerary';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import GeneratedItinerary from '../../components/itinerary/GeneratedItinerary';
import ShareItineraryDialog from '../../components/itinerary/ShareItineraryDialog';
import ItineraryMap from '../../components/map/ItineraryMap';

const ItineraryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'map'

  const { useItineraryDetails, useDeleteItinerary } = useItinerary();
  const { data: itinerary, isLoading, error } = useItineraryDetails(id);
  const deleteItineraryMutation = useDeleteItinerary();

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/itinerary/${id}/edit`);
    handleMenuClose();
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteItineraryMutation.mutateAsync(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
    }
    setDeleteDialogOpen(false);
  };

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
          Failed to load itinerary. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!itinerary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Itinerary not found.</Alert>
      </Box>
    );
  }

  // Flatten activities from all day plans
  const allActivities = itinerary.dayPlans.reduce((acc, day) => {
    return [...acc, ...day.activities];
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {itinerary.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {itinerary.destination.city}, {itinerary.destination.country}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                Edit
              </MenuItem>
              <MenuItem onClick={handleShare}>
                <ListItemIcon>
                  <ShareIcon fontSize="small" />
                </ListItemIcon>
                Share
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Travel Style
            </Typography>
            <Typography variant="body1" paragraph>
              {itinerary.travelStyle}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Budget
            </Typography>
            <Typography variant="body1" paragraph>
              {formatCurrency(itinerary.budget.planned, itinerary.budget.currency)}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Tabs value={view} onChange={(_, newValue) => setView(newValue)}>
            <Tab
              icon={<ListIcon />}
              label="List View"
              value="list"
            />
            <Tab
              icon={<MapIcon />}
              label="Map View"
              value="map"
            />
          </Tabs>
        </Box>
      </Paper>

      {view === 'list' ? (
        <GeneratedItinerary itinerary={itinerary} />
      ) : (
        <Paper sx={{ height: 600, mb: 3 }}>
          <ItineraryMap
            itinerary={itinerary}
            activities={allActivities}
          />
        </Paper>
      )}

      <ShareItineraryDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        itinerary={itinerary}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Itinerary</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this itinerary? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItineraryDetails; 