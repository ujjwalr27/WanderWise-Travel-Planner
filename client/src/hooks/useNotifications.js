import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const useNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      auth: {
        userId: user?._id
      }
    });

    socketInstance.on('notification', (notification) => {
      // Update notifications cache
      queryClient.setQueryData(
        ['notifications'],
        (old) => old ? [notification, ...old] : [notification]
      );

      // Update unread count
      queryClient.setQueryData(
        ['notifications', 'unread'],
        (old) => (old || 0) + 1
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, queryClient]);

  // Get notifications
  const {
    data: notifications = [],
    isLoading,
    error
  } = useQuery(
    ['notifications'],
    async () => {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      return data.notifications;
    },
    {
      enabled: !!user
    }
  );

  // Get unread count
  const { data: unreadCount = 0 } = useQuery(
    ['notifications', 'unread'],
    async () => {
      const response = await fetch('/api/notifications/unread/count');
      const data = await response.json();
      return data.count;
    },
    {
      enabled: !!user
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    async (id) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
      }
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    async () => {
      const response = await fetch('/api/notifications/read/all', {
        method: 'PATCH'
      });
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
      }
    }
  );

  // Delete notification mutation
  const deleteNotificationMutation = useMutation(
    async (id) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
      }
    }
  );

  const markAsRead = useCallback(
    (id) => markAsReadMutation.mutateAsync(id),
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(
    () => markAllAsReadMutation.mutateAsync(),
    [markAllAsReadMutation]
  );

  const deleteNotification = useCallback(
    (id) => deleteNotificationMutation.mutateAsync(id),
    [deleteNotificationMutation]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

export default useNotifications; 