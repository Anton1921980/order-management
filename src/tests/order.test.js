const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../server');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const request = supertest(app);

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  balance: 1000
};

const testProduct = {
  name: 'Test Product',
  price: 50,
  stock: 10
};

// Connect to test database before tests
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI + '_test';
  await mongoose.connect(testDbUri);
});

// Clean up database after tests
afterAll(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await mongoose.connection.close();
});

// Clean up database before each test
beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
});

describe('Order API', () => {
  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      // Create test user and product
      const user = await User.create(testUser);
      const product = await Product.create(testProduct);

      // Create order
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 2
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.order.totalPrice).toBe(product.price * 2);

      // Check if user balance was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBe(user.balance - (product.price * 2));

      // Check if product stock was updated
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(product.stock - 2);
    });

    it('should return 400 if user has insufficient balance', async () => {
      // Create test user with low balance
      const user = await User.create({
        ...testUser,
        balance: 10 // Not enough for the order
      });
      const product = await Product.create(testProduct);

      // Try to create order
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 2
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Insufficient balance');

      // Check that user balance and product stock were not changed
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBe(10);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(product.stock);
    });

    it('should return 400 if product stock is insufficient', async () => {
      // Create test user and product with low stock
      const user = await User.create(testUser);
      const product = await Product.create({
        ...testProduct,
        stock: 1 // Not enough for the order
      });

      // Try to create order
      const response = await request
        .post('/api/orders')
        .send({
          userId: user._id,
          productId: product._id,
          quantity: 2
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Not enough product in stock');

      // Check that user balance and product stock were not changed
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBe(user.balance);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(1);
    });
  });

  describe('GET /api/orders/:userId', () => {
    it('should get all orders for a user', async () => {
      // Create test user and product
      const user = await User.create(testUser);
      const product = await Product.create(testProduct);

      // Create orders
      await Order.create({
        userId: user._id,
        productId: product._id,
        quantity: 2,
        totalPrice: product.price * 2
      });

      await Order.create({
        userId: user._id,
        productId: product._id,
        quantity: 1,
        totalPrice: product.price
      });

      // Get user orders
      const response = await request.get(`/api/orders/${user._id}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.data.orders.length).toBe(2);
    });

    it('should return 404 if user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request.get(`/api/orders/${nonExistentId}`);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('User not found');
    });
  });

  // Test for rate limiting
  describe('Rate Limiting', () => {
    it('should limit requests to 10 per minute', async () => {
      const user = await User.create(testUser);
      
      // Make 11 requests
      for (let i = 0; i < 10; i++) {
        await request.get(`/api/orders/${user._id}`);
      }
      
      // The 11th request should be rate limited
      const response = await request.get(`/api/orders/${user._id}`);
      
      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many requests');
    });
  });
});
