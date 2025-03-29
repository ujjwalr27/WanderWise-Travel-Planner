const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/validation.middleware');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, preferences } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: 'Email already registered'
    });
  }

  // Create new user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    preferences: preferences || {}
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    user: user.getPublicProfile(),
    token
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    user: user.getPublicProfile(),
    token
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.getPublicProfile()
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  // In a real application, you might want to invalidate the token
  // This could be done by maintaining a blacklist of tokens in Redis
  res.json({
    message: 'Logged out successfully'
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    // Verify existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Generate new token
    const newToken = generateToken(user._id);

    res.json({
      token: newToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token'
    });
  }
});

// Request password reset
const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // In a real application, send reset token via email
  // For now, just return it in response
  res.json({
    message: 'Password reset instructions sent to your email',
    resetToken // Remove this in production
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid or expired reset token'
    });
  }
});

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  refreshToken,
  resetPasswordRequest,
  resetPassword
}; 