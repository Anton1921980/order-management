const rateLimit = require('express-rate-limit');

// Create a rate limiter middleware: 10 requests per minute
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again after a minute'
  }
});

module.exports = apiRateLimiter;
