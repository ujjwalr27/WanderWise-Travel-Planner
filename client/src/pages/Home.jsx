import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExploreOutlined as ExploreIcon,
  FlightTakeoffOutlined as FlightIcon,
  PersonOutlineOutlined as PersonIcon,
  AutoAwesomeOutlined as AIIcon,
  MapOutlined as MapIcon,
  ChatOutlined as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Planning',
      description: 'Let artificial intelligence create personalized travel itineraries based on your preferences.'
    },
    {
      icon: <ExploreIcon sx={{ fontSize: 40 }} />,
      title: 'Discover Destinations',
      description: 'Explore amazing places around the world with smart recommendations.'
    },
    {
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      title: 'Interactive Maps',
      description: 'Visualize your journey with interactive maps and location-based suggestions.'
    },
    {
      icon: <FlightIcon sx={{ fontSize: 40 }} />,
      title: 'Complete Itineraries',
      description: 'Get detailed day-by-day plans including activities, restaurants, and accommodations.'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      title: 'Real-time Assistance',
      description: 'Chat with our AI assistant for instant help and travel recommendations.'
    },
    {
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
      title: 'Personalized Experience',
      description: 'Tailored suggestions based on your preferences and travel style.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.9)}), url('/travel-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          py: { xs: 8, md: 12 },
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h1" 
                component="h1" 
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 3
                }}
              >
                Plan Your Perfect Trip with AI
              </Typography>
              <Typography 
                variant="h5" 
                paragraph
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Let artificial intelligence create your ideal travel itinerary, complete with personalized recommendations and real-time assistance.
              </Typography>
              <Box sx={{ mt: 4 }}>
                {user ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    sx={{ 
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem'
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{ 
                        mr: 2,
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem'
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{ 
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem'
                      }}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/hero-image.jpg"
                alt="Travel Planning"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: theme.shadows[15],
                  transform: 'perspective(1000px) rotateY(-10deg)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg)'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          sx={{
            mb: 6,
            fontWeight: 600
          }}
        >
          Why Choose AI Travel Agent?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
                elevation={3}
              >
                <CardContent sx={{ 
                  p: 4, 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%'
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'background.default',
          py: 8
        }}
      >
        <Container maxWidth="md">
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: 'white',
              borderRadius: 4
            }}
            elevation={4}
          >
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
              Ready to Start Your Journey?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Join now and let AI help you plan your next adventure.
            </Typography>
            {!user && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ 
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem'
                }}
              >
                Create Free Account
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 