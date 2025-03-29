const { asyncHandler } = require('../middleware/validation.middleware');
const chatService = require('../services/chat.service');

// Get chat history
const getChatHistory = asyncHandler(async (req, res) => {
  try {
    const history = await chatService.getChatHistory(req.user._id);
    res.json({ messages: history });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      error: 'Failed to get chat history',
      message: error.message
    });
  }
});

// Send message
const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { content, itineraryId } = req.body;
    
    const response = await chatService.generateResponse(content, {
      userId: req.user._id,
      itineraryId
    });

    res.json({ message: response });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Get travel suggestions
const getTravelSuggestions = asyncHandler(async (req, res) => {
  try {
    const { query } = req.body;
    const suggestions = await chatService.getTravelSuggestions(
      query,
      req.user.preferences
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Get travel suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get travel suggestions',
      message: error.message
    });
  }
});

// Clear chat history
const clearChatHistory = asyncHandler(async (req, res) => {
  try {
    await chatService.clearChatHistory(req.user._id);
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      error: 'Failed to clear chat history',
      message: error.message
    });
  }
});

// Handle WebSocket connection
const handleWebSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token and attach user to socket
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.userId);
    
    socket.join(`user:${socket.user.userId}`);

    socket.on('message', async (message, auth) => {
      try {
        if (!auth?.token) {
          throw new Error('Authentication required');
        }

        const response = await chatService.generateResponse(
          message.content,
          {
            userId: socket.user.userId,
            itineraryId: message.itineraryId
          }
        );

        socket.emit('message', {
          sender: 'assistant',
          content: response,
          timestamp: new Date(),
          itineraryId: message.itineraryId
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.emit('error', {
          message: 'Failed to process message',
          error: error.message
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.userId);
      socket.leave(`user:${socket.user.userId}`);
    });
  });
};

module.exports = {
  getChatHistory,
  sendMessage,
  getTravelSuggestions,
  clearChatHistory,
  handleWebSocket
}; 