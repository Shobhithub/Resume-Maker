const rateLimit = require('express-rate-limit');

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many rewrite requests from this network. Please wait a few minutes and try again.',
  },
});

const parseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many resume uploads from this network. Please wait a few minutes and try again.',
  },
});

module.exports = { aiRateLimit, parseRateLimit };
