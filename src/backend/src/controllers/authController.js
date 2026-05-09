const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Content = require('../models/Content');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Password Strength Validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
      if (!password || !passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });

      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId: newUser._id
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Get subscription status
      const subscription = await Subscription.findOne({
        userId: user._id,
        status: 'active',
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 });

      const isPremium = !!subscription;

      // Calculate generations today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const generationsToday = await Content.countDocuments({
        ownerId: user._id,
        dateCreated: { $gte: startOfDay }
      });

      const PLAN_LIMITS = {
        free: 5,
        starter: 100,
        pro: 500,
        premium: 1000
      };

      const planType = subscription ? subscription.planType : 'free';
      const limit = PLAN_LIMITS[planType] || 5;

      // Prepare user object for response
      // For premium users, we return monthly usage as 'generationsToday' to maintain frontend compatibility
      const usage = isPremium ? (user.generationsMonthly || 0) : generationsToday;

      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        subscriptionType: planType,
        generationsLimit: limit,
        generationsToday: usage
      };

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        console.error('❌ CRITICAL: JWT_SECRET not set!');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  // Verify token (for protected routes)
  static async verifyToken(req, res) {
    // This middleware is handled by authenticateToken
    res.json({
      success: true,
      user: req.user,
      message: 'Token is valid'
    });
  }

  // Google Login

  static async googleLogin(req, res) {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: 'Google credential is required'
        });
      }

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      // Find or create user
      let user = await User.findOne({ $or: [{ googleId }, { email }] });

      if (user) {
        // Update googleId if it wasn't set (linked account)
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        // Create new user (random password since it's not used)
        user = new User({
          username: name || email.split('@')[0],
          email,
          googleId,
          password: await bcrypt.hash(Math.random().toString(36), 10)
        });
        await user.save();
      }

      // Get subscription status
      const subscription = await Subscription.findOne({
        userId: user._id,
        status: 'active',
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 });

      const isPremium = !!subscription;

      // Calculate generations today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const generationsToday = await Content.countDocuments({
        ownerId: user._id,
        dateCreated: { $gte: startOfDay }
      });

      const PLAN_LIMITS = {
        free: 5,
        starter: 100,
        pro: 500,
        premium: 1000
      };

      const planType = subscription ? subscription.planType : 'free';
      const limit = PLAN_LIMITS[planType] || 5;
      const usage = isPremium ? (user.generationsMonthly || 0) : generationsToday;

      // Prepare user object for response
      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        picture: picture,
        subscriptionType: planType,
        generationsLimit: limit,
        generationsToday: usage
      };

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Google Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Google Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Google Login failed',
        error: error.message
      });
    }
  }
}


module.exports = AuthController;