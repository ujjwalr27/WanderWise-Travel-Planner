import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import useNotifications from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    deleteNotification
  } = useNotifications();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    handleClose();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    // Handle navigation based on notification type
    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsIcon />
          ) : (
            <NotificationsNoneIcon />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onDelete={() => deleteNotification(notification._id)}
            />
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 