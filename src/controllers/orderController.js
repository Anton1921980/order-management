const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { AppError } = require('../middleware/errorHandler');

// Create a new order with transaction
exports.createOrder = async (req, res, next) => {
  const { userId, productId, quantity } = req.body;

  // Validate required fields
  if (!userId || !productId || !quantity) {
    return next(new AppError('Missing required fields: userId, productId, and quantity are required', 400));
  }

  // Validate quantity
  if (isNaN(quantity) || parseInt(quantity) <= 0) {
    return next(new AppError('Quantity must be a positive number', 400));
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new AppError(`Invalid userId format: ${userId}`, 400));
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError(`Invalid productId format: ${productId}`, 400));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if product exists and has enough stock
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.stock < quantity) {
      throw new AppError('Not enough product in stock', 400);
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Check if user has enough balance
    if (user.balance < totalPrice) {
      throw new AppError('Insufficient balance', 400);
    }

    // Update user balance
    user.balance -= totalPrice;
    await user.save({ session });

    // Update product stock
    product.stock -= quantity;
    await product.save({ session });

    // Create order
    const order = await Order.create([{
      userId,
      productId,
      quantity,
      totalPrice
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: 'success',
      data: {
        order: order[0]
      }
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get all orders for a specific user
exports.getUserOrders = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId (this should be handled by middleware, but adding as a fallback)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError(`Invalid userId format: ${userId}`, 400));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Find all orders for the user
    const orders = await Order.find({ userId });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};
