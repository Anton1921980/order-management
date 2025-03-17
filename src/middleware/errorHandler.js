// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle cast errors (e.g. invalid ObjectId)
const handleCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle validation errors
const handleValidationError = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle duplicate key errors
const handleDuplicateFieldsError = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development vs. production error handling
  if (process.env.NODE_ENV === 'development') {
    // Send detailed error in development
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } 
  
  // For production, send clean error
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Handle specific error types
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.code === 11000) error = handleDuplicateFieldsError(error);
  
  // Handle mongoose errors that don't have proper name/code
  if (error.message && error.message.includes('Cast to ObjectId failed')) {
    error = new AppError('Invalid ID format', 400);
  }

  // Send operational errors
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }
  
  // For programming or unknown errors, send generic message
  console.error('ERROR ', error);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

module.exports = {
  AppError,
  errorHandler
};
