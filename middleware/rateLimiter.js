import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // 10 login attempts per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts, please try again later."
  }
});

// Device registration limiter
export const deviceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 10 device registrations per minute
  message: {
    success: false,
    message: "Too many device registrations, please slow down."
  }
});