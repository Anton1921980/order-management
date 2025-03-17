const mongoose = require('mongoose');
const supertest = require('supertest');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// Set NODE_ENV to test before importing server
process.env.NODE_ENV = 'test';
const app = require('../server');

const request = supertest(app);

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

describe('Transaction Tests', () => {
  it('should not deduct balance if product does not exist', async () => {
    // Create test user
    const user = await User.create({
      name: 'Transaction Test User',
      email: 'transaction@example.com',
      balance: 500
    });
    
    const initialBalance = user.balance;
    const nonExistentProductId = new mongoose.Types.ObjectId();
    
    // Try to create order with non-existent product
    const response = await request
      .post('/api/orders')
      .send({
        userId: user._id,
        productId: nonExistentProductId,
        quantity: 2
      });
    
    // Assertions
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Product not found');
    
    // Check that user balance was not changed
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.balance).toBe(initialBalance);
    
    // Check that no order was created
    const orders = await Order.find({});
    expect(orders.length).toBe(0);
  });
  
  it('should not reduce product stock if user has insufficient balance', async () => {
    // Create test user with low balance
    const user = await User.create({
      name: 'Low Balance User',
      email: 'lowbalance@example.com',
      balance: 10
    });
    
    // Create product
    const product = await Product.create({
      name: 'Expensive Product',
      price: 100,
      stock: 5
    });
    
    const initialStock = product.stock;
    
    // Try to create order
    const response = await request
      .post('/api/orders')
      .send({
        userId: user._id,
        productId: product._id,
        quantity: 1
      });
    
    // Assertions
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Insufficient balance');
    
    // Check that product stock was not changed
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(initialStock);
    
    // Check that no order was created
    const orders = await Order.find({});
    expect(orders.length).toBe(0);
  });
  
  it('should not create an order if user does not exist', async () => {
    // Create product
    const product = await Product.create({
      name: 'Test Product',
      price: 50,
      stock: 10
    });
    
    const initialStock = product.stock;
    const nonExistentUserId = new mongoose.Types.ObjectId();
    
    // Try to create order with non-existent user
    const response = await request
      .post('/api/orders')
      .send({
        userId: nonExistentUserId,
        productId: product._id,
        quantity: 2
      });
    
    // Assertions
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('User not found');
    
    // Check that product stock was not changed
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(initialStock);
    
    // Check that no order was created
    const orders = await Order.find({});
    expect(orders.length).toBe(0);
  });
  
  it('should successfully complete a transaction when all conditions are met', async () => {
    // Create test user and product
    const user = await User.create({
      name: 'Valid User',
      email: 'valid@example.com',
      balance: 200
    });
    
    const product = await Product.create({
      name: 'Valid Product',
      price: 50,
      stock: 10
    });
    
    const initialBalance = user.balance;
    const initialStock = product.stock;
    const quantity = 2;
    
    // Create order
    const response = await request
      .post('/api/orders')
      .send({
        userId: user._id,
        productId: product._id,
        quantity
      });
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.order).toBeDefined();
    
    // Check that user balance was updated correctly
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.balance).toBe(initialBalance - (product.price * quantity));
    
    // Check that product stock was updated correctly
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(initialStock - quantity);
    
    // Check that order was created with correct data
    const orders = await Order.find({});
    expect(orders.length).toBe(1);
    expect(orders[0].quantity).toBe(quantity);
    expect(orders[0].totalPrice).toBe(product.price * quantity);
  });
});
