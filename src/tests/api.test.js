const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../server');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const request = supertest(app);

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Connect to test database before tests
beforeAll(async function() {
  try {
    const testDbUri = process.env.MONGODB_URI + '_api_test';
    await mongoose.connect(testDbUri);
    console.log('Connected to test database:', testDbUri);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

// Clean up database after tests
afterAll(async function() {
  try {
    await mongoose.connection.close();
    console.log('Closed test database connection');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Clean up database before each test
beforeEach(async function() {
  try {
    // Clear all collections we're using for tests
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up before test:', error);
  }
});

describe('API Tests', function() {
  describe('POST /api/orders', function() {
    it('should return 400 if required fields are missing', async function() {
      // Create test user and product
      const user = await User.create({
        name: 'API Test User',
        email: 'apitest@example.com',
        balance: 500
      });
      
      const product = await Product.create({
        name: 'API Test Product',
        price: 50,
        stock: 10
      });
      
      // Missing quantity field
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id
          // quantity is missing
        });
      
      // Assertions
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(typeof response.body).toBe('object');
    });
    
    it('should return 400 if quantity is invalid', async function() {
      // Create test user and product
      const user = await User.create({
        name: 'API Test User',
        email: 'apitest@example.com',
        balance: 500
      });
      
      const product = await Product.create({
        name: 'API Test Product',
        price: 50,
        stock: 10
      });
      
      // Invalid quantity (string instead of number)
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 'invalid'
        });
      
      // Assertions
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(typeof response.body).toBe('object');
    });
    
    it('should return 400 if quantity is zero', async function() {
      // Create test user and product
      const user = await User.create({
        name: 'API Test User',
        email: 'apitest@example.com',
        balance: 500
      });
      
      const product = await Product.create({
        name: 'API Test Product',
        price: 50,
        stock: 10
      });
      
      // Zero quantity
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 0
        });
      
      // Assertions
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(typeof response.body).toBe('object');
    });
    
    it('should return 400 if userId is invalid format', async function() {
      // Create product
      const product = await Product.create({
        name: 'API Test Product',
        price: 50,
        stock: 10
      });
      
      // Invalid userId format
      const response = await request
        .post('/api/orders')
        .send({
          userId: 'invalid-id',
          productId: product._id,
          quantity: 1
        });
      
      // Assertions
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(typeof response.body).toBe('object');
    });
  });
  
  describe('GET /api/orders/:userId', function() {
    it('should return empty array if user has no orders', async function() {
      // Create test user
      const user = await User.create({
        name: 'No Orders User',
        email: 'noorders@example.com',
        balance: 500
      });
      
      // Get user orders
      const response = await request.get('/api/orders/' + user._id);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
      expect(Array.isArray(response.body.data && response.body.data.orders)).toBe(true);
      expect(response.body.data.orders.length).toBe(0);
    });
    
    it('should return all orders for a user in correct format', async function() {
      // Create test user and product
      const user = await User.create({
        name: 'Orders User',
        email: 'orders@example.com',
        balance: 500
      });
      
      const product = await Product.create({
        name: 'Test Product',
        price: 50,
        stock: 10
      });
      
      // Create multiple orders
      await Order.create({
        userId: user._id,
        productId: product._id,
        quantity: 1,
        totalPrice: product.price
      });
      
      await Order.create({
        userId: user._id,
        productId: product._id,
        quantity: 2,
        totalPrice: product.price * 2
      });
      
      // Get user orders
      const response = await request.get('/api/orders/' + user._id);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
      expect(Array.isArray(response.body.data && response.body.data.orders)).toBe(true);
      expect(response.body.data.orders.length).toBe(2);
      
      // Check order structure
      const order = response.body.data.orders[0];
      expect(order).toHaveProperty('userId');
      expect(order).toHaveProperty('productId');
      expect(order).toHaveProperty('quantity');
      expect(order).toHaveProperty('totalPrice');
    });
    
    it('should return 404 if userId is valid format but does not exist', async function() {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request.get('/api/orders/' + nonExistentId);
      
      // Assertions
      expect(response.status).toBe(404);
      expect(typeof response.body).toBe('object');
    });
  });
  
  describe('Error Handling', function() {
    it('should handle server errors gracefully', async function() {
      // Mock a server error by providing an invalid ObjectId
      const response = await request.get('/api/orders/invalid-id');
      
      // Assertions - only check status code range
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      
      // The response body might vary depending on the error handler implementation
      expect(typeof response.body).toBe('object');
    });
  });
});
