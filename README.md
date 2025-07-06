# WanderWise - AI-Powered Travel Planning Platform
WanderWise is a modern, AI-powered travel planning platform that helps users create personalized itineraries, search flights, and manage their travel plans with ease.

![WanderWise Logo](./client/public/wanderwise-icon.png)

## Features

### 🎯 Core Features
- **AI-Powered Itinerary Generation**: Create personalized travel itineraries based on your preferences
- **Real-time Flight Search**: Search and compare flights using the Amadeus API
- **Interactive Maps**: Visualize your travel plans with Google Maps integration
- **Smart Recommendations**: Get AI-powered suggestions for activities and destinations
- **Real-time Chat**: Chat with an AI travel assistant for instant help

### ✨ Additional Features
- **Price Analysis**: Compare flight prices and get insights on the best time to book
- **Flight Comparison**: Compare up to 3 flights side by side
- **Email Sharing**: Share itineraries and flight details via email
- **User Preferences**: Personalized travel recommendations based on user preferences
- **Real-time Notifications**: Stay updated with travel alerts and reminders

## Tech Stack

### Frontend
- React with Vite
- Material-UI (MUI) for UI components
- React Query for data fetching
- Socket.io for real-time features
- Google Maps API for mapping

### Backend
- Node.js with Express
- MongoDB for database
- Redis for caching
- Google Gemini AI for AI features
- Amadeus API for flight data
- Nodemailer for email services

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- MongoDB
- Redis
- API Keys for:
  - Google Maps
  - Google Gemini AI
  - Amadeus
  - Gmail (for email services)

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REDIS_URL=your_redis_url
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_SOCKET_URL=http://localhost:5000
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wanderwise.git
cd wanderwise
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Set up environment variables:
- Copy `.env.example` to `.env` in both client and server directories
- Fill in your API keys and configuration

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Deployment

The application is configured for deployment on Render using the `render.yaml` configuration file.

1. Push your code to GitHub
2. Connect your repository to Render
3. Configure environment variables in Render dashboard
4. Deploy both backend and frontend services

## Project Structure

```
wanderwise/
├── client/                 # Frontend React application
│   ├── public/            # Public assets
│   └── src/
│       ├── components/    # Reusable React components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── context/       # React context providers
│       ├── utils/         # Utility functions
│       └── services/      # API service calls
│
├── server/                # Backend Node.js application
│   └── src/
│       ├── controllers/   # Route controllers
│       ├── models/        # MongoDB models
│       ├── routes/        # API routes
│       ├── services/      # Business logic
│       ├── middleware/    # Custom middleware
│       └── utils/         # Utility functions
```

## API Documentation

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Itineraries
- POST `/api/itineraries` - Create new itinerary
- GET `/api/itineraries` - Get user's itineraries
- GET `/api/itineraries/:id` - Get single itinerary
- PATCH `/api/itineraries/:id` - Update itinerary
- DELETE `/api/itineraries/:id` - Delete itinerary

### Flights
- GET `/api/flights/search` - Search flights
- GET `/api/flights/airports/search` - Search airports
- GET `/api/flights/prices` - Get flight price metrics
- POST `/api/flights/share` - Share flight details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Material-UI](https://mui.com/) for the UI components
- [Amadeus](https://developers.amadeus.com/) for flight data
- [Google Maps Platform](https://developers.google.com/maps) for mapping
- [Google Gemini AI](https://ai.google.dev/) for AI features

## Deployment Instructions

### Local Development

1. Install dependencies:
   ```
   npm run install:all
   ```

2. Start development servers:
   ```
   npm run dev
   ```

### Production Deployment

1. Build the application:
   ```
   npm run build:prod
   ```

2. Start the production server:
   ```
   npm run start:prod
   ```

## Environment Variables

Required environment variables to be set:

### Server
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `GEMINI_API_KEY`: Google Gemini API key
- `REDIS_URL`: Redis connection string
- `NODE_ENV`: Set to 'production' for production mode

## Troubleshooting

### Static Files Not Found
If you encounter the error `ENOENT: no such file or directory, stat '/path/to/client/dist/index.html'`:

1. Make sure you've built the client application:
   ```
   npm run build:client
   ```

2. Check if the `client/dist` directory exists and contains the built files.

3. Start the server in production mode:
   ```
   npm run start:prod
   ``` 
