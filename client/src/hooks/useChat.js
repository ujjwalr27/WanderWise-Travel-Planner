import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const formatMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }

  return {
    content: message.content || '',
    sender: message.sender || 'bot',
    timestamp: message.timestamp || new Date().toISOString()
  };
};

export const useChat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) {
      setIsConnected(false);
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });

    socketInstance.on('message', (message) => {
      const formattedMessage = formatMessage(message);
      if (formattedMessage) {
        setMessages((prev) => [...prev, formattedMessage]);
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, token]);

  // Get chat history
  const getChatHistory = useCallback(async () => {
    if (!user?._id || !token) {
      console.log('No user or token available for chat history');
      return;
    }

    try {
      const response = await axios.get('/api/chat/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.messages) {
        throw new Error('Invalid response format from server');
      }

      const formattedMessages = response.data.messages
        .map(formatMessage)
        .filter(Boolean);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      // Don't throw error, just log it and continue with empty messages
      setMessages([]);
    }
  }, [user, token]);

  // Load chat history on mount and when user/token changes
  useEffect(() => {
    if (user && token && isConnected) {
      getChatHistory();
    }
  }, [user, token, isConnected, getChatHistory]);

  // Send message
  const sendMessage = useCallback((content) => {
    if (!socket || !isConnected || !content || !token) {
      console.warn('Cannot send message: socket not connected, no content, or no token');
      return;
    }

    const message = formatMessage({
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    });

    if (message) {
      socket.emit('message', message, { token });
      setMessages((prev) => [...prev, message]);
    }
  }, [socket, isConnected, token]);

  // Clear chat
  const clearChat = useCallback(async () => {
    if (!token) {
      console.warn('Cannot clear chat: no token available');
      return;
    }

    try {
      await axios.delete('/api/chat/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, [token]);

  return {
    messages,
    sendMessage,
    clearChat,
    isConnected
  };
};

export default useChat; 