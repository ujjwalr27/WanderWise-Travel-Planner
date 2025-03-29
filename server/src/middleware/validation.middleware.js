const { validationResult } = require('express-validator');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Check if running in production mode
  const isProduction = process.env.NODE_ENV === 'production';

  // Handle Mongo duplicate key errors
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Error',
      message: 'A record with this information already exists'
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return res.status(422).json({
      error: 'Validation Error',
      details: validationErrors
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Server Error',
    message: err.message || 'Something went wrong',
    // Include the stack trace only in non-production environments
    ...(isProduction ? {} : { stack: err.stack })
  });
};

// Not found handler for unmatched routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
};

// Async handler to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  validateRequest,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
