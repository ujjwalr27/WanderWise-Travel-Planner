const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const chatController = require('./controllers/chat.controller');
const notificationController = require('./controllers/notification.controller');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const itineraryRoutes = require('./routes/itinerary.routes');
const aiRoutes = require('./routes/ai.routes');
const chatRoutes = require('./routes/chat.routes');
const mapRoutes = require('./routes/map.routes');
const notificationRoutes = require('./routes/notification.routes');
const flightRoutes = require('./routes/flight.routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', mapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flights', flightRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  console.log('Serving static files from:', clientPath);
  
  // Check if the client build directory exists
  const fs = require('fs');
  if (!fs.existsSync(clientPath)) {
    console.error('ERROR: Client build directory does not exist:', clientPath);
    console.error('Make sure to build the client application before deploying');
  }
  
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(clientPath, 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('ERROR: index.html does not exist at:', indexPath);
      return res.status(500).send('Server configuration error: index.html not found');
    }
    
    res.sendFile(indexPath);
  });
} else {
  // Basic route for development
  app.get('/', (req, res) => {
    res.json({ message: 'AI Travel Agent API' });
  });
}

// Initialize WebSocket handlers
chatController.handleWebSocket(io);
notificationController.handleWebSocket(io);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 