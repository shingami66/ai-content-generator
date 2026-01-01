# AI Backend API

Backend server for AI Create Studio using Express.js and MySQL.

## ✅ Database Connection Status

**Connected to your existing `ai_db` database!**

Your database tables:
- `registereduser` - User accounts
- `content` - Generated AI content
- `subscription` - User subscriptions
- `complaints+suggestions` - User feedback
- `payment` - Payment records
- `administrator` - Admin accounts

## Setup Instructions

### 1. Database is Already Connected! ✅

The backend is already connected to your `ai_db` database in phpMyAdmin.

### 2. Environment Variables

The `.env` file is configured with your database:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_db
PORT=3001
```

### 3. Backend Server is Running! 🚀

Server is running on: http://localhost:3001
Database: ai_db (Connected ✅)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (uses `registereduser` table)
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Content
- `GET /api/content/user/:userId` - Get user's AI generated content
- `POST /api/content/save` - Save new content
- `DELETE /api/content/:id` - Delete content

### Feedback
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback/submit` - Submit new feedback

### Subscription
- `GET /api/subscription/user/:userId` - Get user subscription
- `POST /api/subscription/update` - Create or update subscription

## Example API Calls

### Register User
```javascript
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'John Doe',
    email: 'john@example.com',
    password: '123456'
  })
});
```

### Login User
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: '123456'
  })
});
```

### Save AI Content
```javascript
fetch('http://localhost:3001/api/content/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    type: 'image',
    description: 'A beautiful sunset',
    url: 'https://example.com/image.jpg'
  })
});
```

## Test the API

1. Server Homepage: http://localhost:3001
2. Test DB Connection: http://localhost:3001/api/test-db

## Troubleshooting

### Database Connection Works! ✅
You should see:
```
✅ Database connected successfully!
📊 Connected to database: ai_db
```

### Common Issues
1. **Make sure XAMPP/WAMP is running**
2. **Check MySQL service is active**
3. **Verify port 3306 is accessible**
