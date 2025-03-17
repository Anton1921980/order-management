# Testing Documentation

This document provides information about the testing strategy and how to run tests for the Order Management API.

## Testing Strategy

The application includes comprehensive tests covering the following areas:

### Backend Tests

1. **Unit Tests**: Tests for key business logic such as:
   - Balance checks
   - Stock validation
   - Total price calculation

2. **API Tests**: Tests for API endpoints to ensure they:
   - Work correctly
   - Handle errors properly
   - Return appropriate status codes and responses

3. **Transaction Tests**: Tests to verify that:
   - Partial orders don't occur
   - If balance deduction fails, stock remains unchanged
   - If stock validation fails, balance remains unchanged

4. **Rate Limiting Tests**: Tests to ensure the API:
   - Restricts users after exceeding the limit (10 requests per minute)
   - Returns 429 status code when rate limit is exceeded

### Frontend Tests (React)

1. **Component Tests**: Tests for React components:
   - Form validation
   - Order handling flow
   - UI state management

2. **API Service Tests**: Tests for API service functions:
   - API calls are made with correct parameters
   - Responses are handled properly
   - Error handling works as expected

## Running Tests

### Prerequisites

- Node.js and npm installed
- MongoDB running locally or accessible via connection string
- Environment variables set up correctly (see `.env.example`)

### Backend Tests

To run all backend tests:

```bash
npm run test:backend
```

To run a specific test file:

```bash
npx jest src/tests/unit.test.js
```

### Frontend Tests

To run all frontend tests:

```bash
npm run test:frontend
```

To run frontend tests with coverage:

```bash
cd client && npm run test:coverage
```

### Run All Tests

To run both backend and frontend tests:

```bash
npm run test:all
```

## Test Files

### Backend Test Files

- `src/tests/unit.test.js`: Unit tests for business logic
- `src/tests/api.test.js`: API endpoint tests
- `src/tests/transaction.test.js`: Transaction integrity tests
- `src/tests/rate-limit.test.js`: Rate limiting tests
- `src/tests/order.test.js`: Order creation and retrieval tests

### Frontend Test Files

- `client/src/tests/OrderForm.test.jsx`: Tests for the OrderForm component
- `client/src/tests/api.test.js`: Tests for the API service functions
- `client/src/tests/setup.js`: Test setup file

## Test Database

The tests use a separate test database to avoid affecting the production data. The test database name is appended with `_test` to the MongoDB URI specified in the environment variables.

## Continuous Integration

For CI/CD pipelines, you can use the following commands:

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Run tests
npm run test:all
```

## Troubleshooting

If you encounter issues with the tests:

1. Make sure MongoDB is running and accessible
2. Check that all environment variables are set correctly
3. Ensure all dependencies are installed (`npm install` in both root and client directories)
4. Check for any console errors during test execution
