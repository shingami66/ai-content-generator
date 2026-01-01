const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validateRegister, validateLogin } = require('../middlewares/validation');

// Register endpoint
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const [existing] = await db.query(
      'SELECT * FROM registereduser WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user with hashed password
    const [result] = await db.query(
      'INSERT INTO registereduser (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      'SELECT UserID as id, Username as username, Email as email, Password as hashedPassword FROM registereduser WHERE Email = ?',
      [email]
    );

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    let user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Remove hashedPassword from user object
    delete user.hashedPassword;

    // Fetch subscription status
    const [subscriptions] = await db.query(
      `SELECT SubscriptionID, UserID, StartDate, EndDate, Status 
       FROM subscription 
       WHERE UserID = ? AND Status = 'active' 
       ORDER BY EndDate DESC LIMIT 1`,
      [user.id]
    );

    const subscription = subscriptions[0];
    const isPremium = subscription && new Date(subscription.EndDate) > new Date();

    // Add subscription info to user object
    user.subscriptionType = isPremium ? 'premium' : 'free';
    user.generationsLimit = isPremium ? 999999 : 5;
    user.generationsToday = 0; // Reset on login (in production, track this in DB)

    // Generate JWT token - fail fast if JWT_SECRET is not set
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

module.exports = router;
