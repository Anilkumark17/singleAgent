const rateLimit = require("express-rate-limit");

const analysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many analysis requests. Please try again later.",
  },
});

module.exports = { analysisRateLimit };
