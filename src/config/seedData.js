const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample users data
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    balance: 1000
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    balance: 750
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    balance: 500
  }
];

// Sample products data
const products = [
  {
    name: 'Laptop',
    price: 999.99,
    stock: 10
  },
  {
    name: 'Smartphone',
    price: 499.99,
    stock: 20
  },
  {
    name: 'Headphones',
    price: 99.99,
    stock: 30
  },
  {
    name: 'Monitor',
    price: 299.99,
    stock: 15
  },
  {
    name: 'Keyboard',
    price: 59.99,
    stock: 25
  }
];

// Seed data function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    
    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);
    
    console.log('Database seeded successfully');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
