const express = require('express');
const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const rateLimiter = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

// Apply rate limiter to all routes
router.use(rateLimiter);

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders/:userId', validateObjectId('userId'), orderController.getUserOrders);

// User routes
router.route('/users')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/users/:id')
  .get(validateObjectId(), userController.getUser)
  .patch(validateObjectId(), userController.updateUser)
  .delete(validateObjectId(), userController.deleteUser);

// Product routes
router.route('/products')
  .get(productController.getAllProducts)
  .post(productController.createProduct);

router.route('/products/:id')
  .get(validateObjectId(), productController.getProduct)
  .patch(validateObjectId(), productController.updateProduct)
  .delete(validateObjectId(), productController.deleteProduct);

module.exports = router;
