const mongoose = require('mongoose');
const { AppError } = require('./errorHandler');

/**
 * Middleware to validate ObjectId parameters
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // Skip validation if no ID parameter exists
    if (!id) {
      return next();
    }
    
    // Validate that ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid ${paramName} format: ${id}`, 400));
    }
    
    // Continue to next middleware/controller
    next();
  };
};

module.exports = validateObjectId;
