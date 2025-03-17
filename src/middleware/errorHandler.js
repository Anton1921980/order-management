// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  console.error('ERROR 💥', err);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new AppError(`Duplicate field value: ${field}. Please use another value!`, 400);
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    err = new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
  }

  // MongoDB cast error (invalid ID)
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
  }

  // Send response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { error: err, stack: err.stack })
  });
};

module.exports = {
  AppError,
  errorHandler
};
