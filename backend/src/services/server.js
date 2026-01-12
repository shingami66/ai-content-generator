const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const db = require('../config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Increase timeout for long-running requests like image and video generation
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes (for video generation)
  res.setTimeout(300000); // 5 minutes (for video generation)
  next();
});

// Middleware
// Configure CORS to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
// For Stripe webhook
app.use('/api/subscription/webhook', express.raw({type: 'application/json'}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per windowMs (increased for testing)
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 generation requests per minute
  message: 'Too many generation requests, please slow down.',
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/content/generate', generationLimiter);


// Request logging middleware - only log in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Only log body in development, and exclude sensitive fields
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      // Remove sensitive fields from logs
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.cvv) sanitizedBody.cvv = '[REDACTED]';
      if (sanitizedBody.cardNumber) sanitizedBody.cardNumber = '[REDACTED]';
      console.log('Body:', sanitizedBody);
    }
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AI Backend API is running!' });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as test');
    res.json({ 
      success: true, 
      message: 'Database connection successful!',
      data: rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Authentication routes
const authRoutes = require('../routes/auth');


app.use('/api/auth', authRoutes);

// User routes
const userRoutes = require('../routes/users');
app.use('/api/users', userRoutes);

// Content generation routes
const contentRoutes = require('../routes/content');
app.use('/api/content', contentRoutes);

// Feedback routes
const feedbackRoutes = require('../routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// Subscription routes
const subscriptionRoutes = require('../routes/subscription');
app.use('/api/subscription', subscriptionRoutes);

// Generation tracking routes
const generationsRoutes = require('../routes/generations');
app.use('/api/generations', generationsRoutes);

// 404 handler - must be after all other routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error in development, sanitized in production
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.stack);
  } else {
    console.error('Error:', err.message);
  }
  
  // Sanitize error messages in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  let errorMessage = 'Something went wrong!';
  
  if (isDevelopment) {
    errorMessage = err.message || 'Something went wrong!';
  } else {
    // Don't expose internal errors in production
    if (err.status && err.status < 500) {
      errorMessage = err.message || 'Request failed';
    } else {
      errorMessage = 'An internal server error occurred';
    }
  }
  
  // Always send JSON response
  res.status(err.status || 500).json({ 
    success: false, 
    message: errorMessage,
    ...(isDevelopment && { error: err.message, stack: err.stack })
  });
});

/**
 * ========================================
 * CRON JOB - DAILY GENERATION RESET
 * ========================================
 * 
 * Runs every day at midnight (00:00)
 * Logs a message about the automatic reset
 * 
 * Note: With our date-based counting approach using DATE(DateCreated) = CURDATE(),
 * we don't need to actually delete or reset anything in the database.
 * The count automatically "resets" because the query only counts today's records.
 * 
 * This cron job is here for logging and monitoring purposes.
 */
cron.schedule('0 0 * * *', async () => {
  const now = new Date().toISOString();
  console.log('\n========================================');
  console.log(`🔄 DAILY RESET TRIGGERED AT: ${now}`);
  console.log('========================================');
  console.log('✅ Generation counts automatically reset for all free users');
  console.log('📅 New day begins - all users have fresh 5/5 generations');
  console.log('========================================\n');
  
  try {
    // Optional: Log statistics for monitoring
    const [stats] = await db.query(
      `SELECT 
         COUNT(DISTINCT OwnerID) as active_users,
         COUNT(*) as total_generations
       FROM content 
       WHERE DATE(DateCreated) = CURDATE() - INTERVAL 1 DAY`
    );
    
    console.log('📊 Yesterday\'s Statistics:');
    console.log(`   - Active users: ${stats[0].active_users}`);
    console.log(`   - Total generations: ${stats[0].total_generations}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Error fetching statistics:', error.message);
  }
}, {
  timezone: "Africa/Cairo"  // 🇸🇩 Sudan timezone (same as Egypt)
});

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`🚀 SERVER STARTED`);
  console.log('========================================');
  console.log(`🌐 Running on: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`⏰ Cron Job: Active (Daily reset at 00:00 Africa/Cairo)`);
  console.log(`✅ Generation tracking: Using 'content' table`);
  console.log('========================================\n');
});


