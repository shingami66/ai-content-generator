# AI Content Generation API - Backend

Express.js backend for AI-powered content generation platform.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with secure password hashing
- **Content Generation** - OpenAI DALL-E image generation
- **Subscription Management** - Premium/free tier handling
- **Rate Limiting** - Protection against abuse
- **Database Integration** - MySQL with connection pooling
- **Input Validation** - Comprehensive validation middleware
- **Security** - CORS, helmet, input sanitization
- **Automated Tasks** - Daily generation reset via cron jobs

## 📁 Project Structure

```
src/backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection & initialization
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── contentController.js # Content generation & management
│   │   └── generationController.js # Generation limits & tracking
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── validation.js       # Input validation middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── content.js         # Content management routes
│   │   ├── generations.js     # Generation tracking routes
│   │   ├── subscription.js    # Subscription routes
│   │   ├── users.js           # User management routes
│   │   └── feedback.js        # Feedback routes
│   ├── utils/
│   │   └── cronJobs.js        # Scheduled tasks
│   ├── app.js                 # App export for testing
│   └── server.js              # Main server file
├── uploads/                   # Generated content storage
├── package.json
└── README.md
```

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create `.env` file in the backend directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ai_db
   DB_PORT=3306

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_super_secure_jwt_secret_key_here

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key

   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Database Setup:**
   - Ensure MySQL is running
   - Create database `ai_db`
   - Tables will be created automatically on first run

## 🚀 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Content Management
- `GET /api/content/user/:userId` - Get user's generated content
- `POST /api/content/generate` - Generate new content
- `POST /api/content/save` - Save content manually
- `DELETE /api/content/:id` - Delete content

### Generation Tracking
- `GET /api/generations/can-generate/:userId` - Check generation limits
- `GET /api/generations/count/:userId` - Get generation count
- `POST /api/generations/increment` - Increment generation counter

### Subscription
- `GET /api/subscription/:userId` - Get subscription status
- `POST /api/subscription/activate` - Activate subscription

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Multi-tier rate limiting (general, auth, generation)
- **Input Validation** - Comprehensive validation with express-validator
- **CORS Protection** - Configured for frontend origin
- **SQL Injection Prevention** - Parameterized queries
- **Request Size Limits** - Payload size restrictions

## 🗄️ Database Schema

### Tables
- `registereduser` - User accounts
- `content` - Generated content
- `subscription` - User subscriptions
- `payment` - Payment records

### Indexes
- `idx_content_owner_date` - Content queries by owner and date
- `idx_content_type` - Content queries by type
- `idx_subscription_user_status` - Subscription queries
- `idx_registereduser_email` - User email lookups

## ⏰ Scheduled Tasks

- **Daily Reset** - Generation counters reset at midnight (Africa/Cairo timezone)

## 🧪 Testing

```bash
# Run tests
npm test

# Test database connection
GET /api/test-db
```

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Use a process manager (PM2, forever)
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS
5. Configure environment variables
6. Set up database backups

## 📊 Monitoring

- Request logging in development
- Error tracking
- Database connection monitoring
- Cron job execution logs

## 🔧 Development

### Adding New Routes
1. Create controller in `src/controllers/`
2. Add validation in `src/middleware/validation.js`
3. Create route in `src/routes/`
4. Import and use in `src/server.js`

### Adding New Middleware
1. Create middleware file in `src/middleware/`
2. Import and apply in `src/server.js` or specific routes

## 📝 License

ISC License