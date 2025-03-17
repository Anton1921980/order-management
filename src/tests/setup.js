// This file contains setup code that will be run before each test file
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config();

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Generate a unique test database name to avoid conflicts
const uniqueTestId = Date.now();
const testDbName = 'order-management-test-' + uniqueTestId;

// Set MongoDB URI for tests
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/order-management';
}

// Create a specific test database URI
process.env.TEST_MONGODB_URI = process.env.MONGODB_URI.replace(/\/[^/]+$/, '/' + testDbName);

// Set a default port for testing
process.env.PORT = process.env.PORT || 3001;

// Global test setup
jest.setTimeout(30000); // 30 seconds for slower test environments

// Silence console logs during tests unless in verbose mode
if (process.env.VERBOSE_TESTS !== 'true') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  // Keep error and warn for debugging
  // global.console.error = jest.fn();
  // global.console.warn = jest.fn();
}

// Add custom error handling for mongoose
mongoose.set('strictQuery', false);

// Make the ObjectId validation helper available globally
global.isValidObjectId = function(id) {
  return mongoose.Types.ObjectId.isValid(id);
};
