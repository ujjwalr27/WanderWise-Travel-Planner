const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/validation.middleware');

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    res.json({
      status: 'success',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update basic profile fields
    if (req.body.firstName !== undefined) {
      user.firstName = req.body.firstName;
    }
    if (req.body.lastName !== undefined) {
      user.lastName = req.body.lastName;
    }

    // Ensure preferences exists
    if (!user.preferences) {
      user.preferences = {
        travelStyle: 'cultural',
        maxBudget: 0,
        preferredDestinations: [],
        dietaryRestrictions: []
      };
    }

    // If a nested preferences object is sent, use that.
    if (req.body.preferences) {
      const { travelStyle, maxBudget, preferredDestinations, dietaryRestrictions } = req.body.preferences;
      if (travelStyle !== undefined) {
        user.preferences.travelStyle = travelStyle;
      }
      if (maxBudget !== undefined) {
        user.preferences.maxBudget = Number(maxBudget);
      }
      if (preferredDestinations !== undefined) {
        user.preferences.preferredDestinations = Array.isArray(preferredDestinations)
          ? preferredDestinations
          : [];
      }
      if (dietaryRestrictions !== undefined) {
        user.preferences.dietaryRestrictions = Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions
          : [];
      }
    } else {
      // Fallback if fields are sent with dot-notation keys
      if (req.body['preferences.travelStyle'] !== undefined) {
        user.preferences.travelStyle = req.body['preferences.travelStyle'];
      }
      if (req.body['preferences.maxBudget'] !== undefined) {
        user.preferences.maxBudget = Number(req.body['preferences.maxBudget']);
      }
      if (req.body['preferences.preferredDestinations'] !== undefined) {
        user.preferences.preferredDestinations = Array.isArray(req.body['preferences.preferredDestinations'])
          ? req.body['preferences.preferredDestinations']
          : [];
      }
      if (req.body['preferences.dietaryRestrictions'] !== undefined) {
        user.preferences.dietaryRestrictions = Array.isArray(req.body['preferences.dietaryRestrictions'])
          ? req.body['preferences.dietaryRestrictions']
          : [];
      }
    }

    // Mark preferences as modified and save
    user.markModified('preferences');
    const savedUser = await user.save();
    console.log('Saved user:', savedUser);

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: savedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update profile',
      details: error
    });
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
});

// Get user preferences
const getPreferences = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {
        travelStyle: 'cultural',
        maxBudget: 0,
        preferredDestinations: [],
        dietaryRestrictions: []
      };
      await user.save();
    }

    res.json({
      status: 'success',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get preferences'
    });
  }
});

// Update user preferences
const updatePreferences = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Ensure preferences exists
    if (!user.preferences) {
      user.preferences = {
        travelStyle: 'cultural',
        maxBudget: 0,
        preferredDestinations: [],
        dietaryRestrictions: []
      };
    }

    // Update preferences using direct properties (for non-nested requests)
    const { travelStyle, maxBudget, preferredDestinations, dietaryRestrictions } = req.body;
    if (travelStyle !== undefined) {
      user.preferences.travelStyle = travelStyle;
    }
    if (maxBudget !== undefined) {
      user.preferences.maxBudget = Number(maxBudget);
    }
    if (preferredDestinations !== undefined) {
      user.preferences.preferredDestinations = Array.isArray(preferredDestinations)
        ? preferredDestinations
        : [];
    }
    if (dietaryRestrictions !== undefined) {
      user.preferences.dietaryRestrictions = Array.isArray(dietaryRestrictions)
        ? dietaryRestrictions
        : [];
    }

    user.markModified('preferences');
    const savedUser = await user.save();
    console.log('Saved user preferences:', savedUser.preferences);

    res.json({
      status: 'success',
      message: 'Preferences updated successfully',
      preferences: savedUser.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update preferences'
    });
  }
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences
};
