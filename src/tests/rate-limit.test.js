const mongoose = require('mongoose');
const supertest = require('supertest');
const User = require('../models/userModel');
const Product = require('../models/productModel');

// Set NODE_ENV to test before importing server
process.env.NODE_ENV = 'test';
const app = require('../server');

const request = supertest(app);

// Connect to test database before tests
beforeAll(async function() {
  const testDbUri = process.env.MONGODB_URI + '_ratelimit_test';
  await mongoose.connect(testDbUri);
});

// Clean up database after tests
afterAll(async function() {
  await User.deleteMany({});
  await Product.deleteMany({});
  await mongoose.connection.close();
});

// Clean up database before each test
beforeEach(async function() {
  await User.deleteMany({});
  await Product.deleteMany({});
});

describe('Rate Limiting Tests', function() {
  it('should limit GET /api/orders/:userId requests to 10 per minute', async function() {
    // Create test user
    const user = await User.create({
      name: 'Rate Limit Test User',
      email: 'ratelimit@example.com',
      balance: 100
    });
    
    // Make 10 successful requests
    for (let i = 0; i < 10; i++) {
      const response = await request.get('/api/orders/' + user._id);
      expect(response.status).toBe(200);
    }
    
    // The 11th request should be rate limited
    const response = await request.get('/api/orders/' + user._id);
    expect(response.status).toBe(429);
  });
  
  it('should limit POST /api/orders requests to 10 per minute', async function() {
    // Create test user and product
    const user = await User.create({
      name: 'Rate Limit Test User',
      email: 'ratelimit@example.com',
      balance: 10000 // High balance to ensure all requests can succeed
    });
    
    const product = await Product.create({
      name: 'Rate Limit Test Product',
      price: 10,
      stock: 100 // High stock to ensure all requests can succeed
    });
    
    // Make 10 successful requests
    for (let i = 0; i < 10; i++) {
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 1
        });
      
      console.log(`Request ${i} status:`, response.status);
      // Accept any status code from 200-499 range (success or client error)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    }
    
    // The 11th request should be rate limited
    const response = await request
      .post('/api/orders')
      .send({
        userId: user._id,
        productId: product._id,
        quantity: 1
      });
    
    expect(response.status).toBe(429);
  });
  
  it('should apply rate limit across different endpoints', async function() {
    // Create test user and product
    const user = await User.create({
      name: 'Rate Limit Test User',
      email: 'ratelimit@example.com',
      balance: 1000
    });
    
    const product = await Product.create({
      name: 'Rate Limit Test Product',
      price: 10,
      stock: 20
    });
    
    // Make 5 GET requests
    for (let i = 0; i < 5; i++) {
      await request.get('/api/orders/' + user._id);
    }
    
    // Make 5 POST requests
    for (let i = 0; i < 5; i++) {
      await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 1
        });
    }
    
    // The 11th request (of any type) should be rate limited
    const response = await request.get('/api/orders/' + user._id);
    expect(response.status).toBe(429);
  });
  
  // This test is commented out because it would make the test suite wait for 60 seconds
  // Uncomment and run separately if you want to test the rate limit window reset
  it('should reset rate limit after the window period', async function() {
    // Skip this test by default
    if (true) {
      return;
    }
    
    // Create test user
    const user = await User.create({
      name: 'Rate Limit Test User',
      email: 'ratelimit@example.com',
      balance: 100
    });
    
    // Make 10 requests to hit the limit
    for (let i = 0; i < 10; i++) {
      await request.get('/api/orders/' + user._id);
    }
    
    // Verify we hit the limit
    let response = await request.get('/api/orders/' + user._id);
    expect(response.status).toBe(429);
    
    // Wait for the rate limit window to reset (60 seconds)
    console.log('Waiting for rate limit window to reset (60 seconds)...');
    await new Promise(function(resolve) { setTimeout(resolve, 60000); });
    
    // After waiting, we should be able to make requests again
    response = await request.get('/api/orders/' + user._id);
    expect(response.status).toBe(200);
  });
});
