const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contentRoutes = require('./routes/content');
const subscriptionRoutes = require('./routes/subscription');
const generationRoutes = require('./routes/generations');
const feedbackRoutes = require('./routes/feedback');
const aiRoutes = require('./routes/ai');

// Import Security Middleware
const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('./utils/logger'); // Import logger

// Import utilities
const { setupCronJobs } = require('./utils/cronJobs');

// Import database
const mongoose = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use((req, res, next) => {
  // Increase timeout for AI generation requests
  req.setTimeout(600000); // 10 minutes (for video generation)
  res.setTimeout(600000); // 10 minutes (for video generation)
  next();
});

// Cross-Origin-Opener-Policy for Google Auth
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Set security headers with relaxed resource policy for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded by frontend
  crossOriginOpenerPolicy: false, // Let the manual middleware handle it
}));

// Request logging (moved up)
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Import webhook routes
const webhookRoutes = require('./routes/webhook');

// Webhook route must be BEFORE body parser because it needs raw body
app.use('/api/webhook', webhookRoutes);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite default just in case
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware (Must be AFTER body parser)
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 5, // Strict for prod, relaxed for dev/test
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 100 : 10,
  message: 'Too many generation requests, please slow down.',
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/content/generate', generationLimiter);

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'AI Content Generation API',
    version: '1.1.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/generations', generationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    res.json({
      success: state === 1,
      message: `Database is ${states[state]}`,
      data: { state: states[state] }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'An internal server error occurred',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Setup cron jobs
setupCronJobs();

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 EXPRESS SERVER STARTED');
  console.log('========================================');
  console.log(`🌐 Running on: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'ai_db'}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('⏰ Cron Jobs: Active (Daily reset at 00:00 Africa/Cairo)');
  console.log('========================================\n');
});

module.exports = app;