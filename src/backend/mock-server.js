const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Mock data
const mockFeedback = [
  {
    id: 1,
    userId: 1,
    name: 'John Doe',
    email: 'john@example.com',
    category: 'Bug Report',
    rating: 4,
    message: 'Great app but found a small bug',
    created_at: new Date().toISOString()
  }
];

// Routes
app.get('/api/feedback', (req, res) => {
  res.json({
    success: true,
    feedback: mockFeedback
  });
});

app.post('/api/feedback/submit', (req, res) => {
  const { userId, name, email, category, rating, message } = req.body;
  
  const newFeedback = {
    id: mockFeedback.length + 1,
    userId: userId || 1,
    name,
    email,
    category,
    rating,
    message,
    created_at: new Date().toISOString()
  };
  
  mockFeedback.push(newFeedback);
  
  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    feedbackId: newFeedback.id
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    userId: Math.floor(Math.random() * 1000)
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 1,
      username: 'Test User',
      email: email
    }
  });
});

// Content routes
app.get('/api/content/user/:userId', (req, res) => {
  res.json({
    success: true,
    content: []
  });
});

app.post('/api/content/save', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Content saved successfully',
    contentId: Math.floor(Math.random() * 1000)
  });
});

// Subscription routes
app.get('/api/subscription/user/:userId', (req, res) => {
  res.json({
    success: true,
    subscription: null
  });
});

app.post('/api/subscription/update', (req, res) => {
  res.json({
    success: true,
    message: 'Subscription updated successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Server is running on http://localhost:${PORT}`);
  console.log(`📊 Using mock data instead of database`);
});

