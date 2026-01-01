# 🎯 Generation Tracking System - Complete Documentation

## ✅ System Overview

This system tracks user content generations with **daily limits** for free users and **unlimited** for premium users.

### Key Features:
- ✅ **Database-backed tracking** using existing `content` table
- ✅ **5 generations/day** for free users
- ✅ **Unlimited** for premium users
- ✅ **Automatic daily reset** at midnight (via cron job)
- ✅ **Real-time count display** on dashboard
- ✅ **Upgrade modal** when limit reached

---

## 📊 How It Works

### 1. **Uses Existing `content` Table**

Instead of creating a new `generations` table, the system uses your existing `content` table:

```sql
-- content table structure:
- ContentID (PK)
- Title
- OwnerID (UserID)
- ContentType (enum: 'image', 'video', 'text', 'other')
- Description
- DateCreated (datetime)
```

**Why this is better:**
- ✅ No new tables needed
- ✅ Tracks actual content (not just counts)
- ✅ Historical data preserved
- ✅ Works with your existing database

### 2. **Daily Count Query**

Counts today's generations using date-based query:

```sql
SELECT COUNT(*) AS count 
FROM content 
WHERE OwnerID = ? AND DATE(DateCreated) = CURDATE()
```

This automatically "resets" every day because it only counts records created **today**.

### 3. **Premium Check**

Checks subscription table for active premium subscription:

```sql
SELECT * FROM subscription 
WHERE UserID = ? 
  AND Status = 'active' 
  AND EndDate > NOW()
```

If found → Unlimited generations ♾️  
If not → Limited to 5/day 🔢

---

## 🔌 Backend API Endpoints

### **1. Check if User Can Generate**

**Endpoint:** `GET /api/generations/can-generate/:userId`

**Response (Free User - 2/5 used):**
```json
{
  "success": true,
  "canGenerate": true,
  "subscriptionType": "free",
  "used": 2,
  "limit": 5,
  "remaining": 3,
  "message": "You have 3 generations remaining today"
}
```

**Response (Free User - Limit Reached):**
```json
{
  "success": true,
  "canGenerate": false,
  "subscriptionType": "free",
  "used": 5,
  "limit": 5,
  "remaining": 0,
  "message": "Daily limit reached. Upgrade to Premium for unlimited generations!"
}
```

**Response (Premium User):**
```json
{
  "success": true,
  "canGenerate": true,
  "subscriptionType": "premium",
  "remaining": "unlimited",
  "used": 0,
  "limit": 999999,
  "message": "Premium user has unlimited generations"
}
```

### **2. Increment Generation Count**

**Endpoint:** `POST /api/generations/increment`

**Request Body:**
```json
{
  "userId": 1,
  "type": "image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Count retrieved successfully",
  "todayCount": 3,
  "limit": 5,
  "remaining": 2
}
```

> **Note:** This is called AFTER content is saved via `/api/content/save`

### **3. Get Current Count**

**Endpoint:** `GET /api/generations/count/:userId`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "limit": 5,
  "remaining": 2
}
```

---

## ⏰ Automatic Daily Reset (Cron Job)

### Configuration in `server.js`:

```javascript
const cron = require('node-cron');

// Runs every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 DAILY RESET TRIGGERED');
  console.log('✅ Generation counts automatically reset for all free users');
  console.log('📅 New day begins - all users have fresh 5/5 generations');
  
  // Optional: Log statistics
  const [stats] = await db.query(`
    SELECT 
      COUNT(DISTINCT OwnerID) as active_users,
      COUNT(*) as total_generations
    FROM content 
    WHERE DATE(DateCreated) = CURDATE() - INTERVAL 1 DAY
  `);
  
  console.log('📊 Yesterday\'s Statistics:');
  console.log(`   - Active users: ${stats[0].active_users}`);
  console.log(`   - Total generations: ${stats[0].total_generations}`);
}, {
  timezone: "Africa/Cairo"  // 🇸🇩 Sudan timezone
});
```

### Cron Schedule Syntax:
```
 ┌────────────── second (optional, 0-59)
 │ ┌──────────── minute (0-59)
 │ │ ┌────────── hour (0-23)
 │ │ │ ┌──────── day of month (1-31)
 │ │ │ │ ┌────── month (1-12)
 │ │ │ │ │ ┌──── day of week (0-7, 0/7 = Sunday)
 │ │ │ │ │ │
 * * * * * *
```

**Current:** `0 0 * * *` = Every day at midnight (00:00)

**Other Examples:**
- `0 */6 * * *` - Every 6 hours
- `0 12 * * *` - Every day at noon
- `0 0 1 * *` - First day of every month at midnight

---

## 💻 Frontend Integration

### 1. **AppContext** (`src/context/AppContext.tsx`)

Three main functions:

```typescript
// Check if user can generate (calls backend)
const canGenerate = async (): Promise<boolean> => {
  const response = await generationAPI.canGenerate(user.id);
  setUser({
    ...user,
    generationsToday: response.used,
    generationsLimit: response.limit
  });
  return response.canGenerate;
};

// Increment after successful generation
const incrementGeneration = async (type: string): Promise<void> => {
  const response = await generationAPI.incrementGeneration(user.id, type);
  setUser({
    ...user,
    generationsToday: response.todayCount
  });
};

// Refresh count from database
const refreshGenerationCount = async (): Promise<void> => {
  const response = await generationAPI.getCount(user.id);
  setUser({
    ...user,
    generationsToday: response.count
  });
};
```

### 2. **Dashboard Flow** (`src/pages/DashboardPage.tsx`)

```typescript
const handleGenerate = async (type: 'image' | 'video') => {
  // 1. Check if allowed from backend
  const allowed = await canGenerate();
  if (!allowed) {
    setShowLimitModal(true); // Show upgrade modal
    return;
  }

  // 2. Generate content
  setIsGenerating(true);
  // ... generation code ...
  
  // 3. Save to content table (this increments count)
  await contentAPI.saveContent(user.id, type, description, url);
  
  // 4. Update count in context
  await incrementGeneration(type);
  
  setIsGenerating(false);
};
```

### 3. **Counter Display**

```tsx
{user && (
  <div>
    {user.subscriptionType === 'premium' ? (
      <span>⭐ Premium: Unlimited Generations</span>
    ) : (
      <span>
        🎨 Generations Today: {user.generationsToday || 0}/{user.generationsLimit || 5}
      </span>
    )}
  </div>
)}
```

### 4. **Limit Modal**

When limit reached, shows modal with:
- ⚠️ Warning message
- Premium benefits list
- **"Upgrade to Premium"** button → navigates to `/subscription`
- "Maybe Later" button

---

## 🗄️ Database Schema

### Tables Used:

**1. `content` table** (tracks generations):
```sql
CREATE TABLE content (
  ContentID INT PRIMARY KEY AUTO_INCREMENT,
  Title VARCHAR(255) NOT NULL,
  OwnerID INT,                    -- UserID who created it
  ContentType ENUM('image','video','text','other'),
  Description TEXT,
  DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (OwnerID) REFERENCES registereduser(UserID)
);
```

**2. `subscription` table** (premium status):
```sql
CREATE TABLE subscription (
  SubscriptionID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT,
  StartDate DATE,
  EndDate DATE,
  Status VARCHAR(50),             -- 'active' or 'cancelled'
  FOREIGN KEY (UserID) REFERENCES registereduser(UserID)
);
```

---

## 🔍 Testing the System

### **Test Scenario 1: Free User Reaching Limit**

1. Login as free user
2. Dashboard shows: "Generations Today: 0/5"
3. Generate 5 images/videos
4. Counter updates: 1/5 → 2/5 → 3/5 → 4/5 → 5/5
5. Try to generate 6th → Limit modal appears
6. Click "Upgrade to Premium" → Navigate to subscription page

### **Test Scenario 2: Premium User**

1. Subscribe to premium (test payment)
2. Dashboard shows: "⭐ Premium: Unlimited Generations"
3. Generate any number of images/videos
4. No limit, counter doesn't increment

### **Test Scenario 3: Daily Reset**

1. Free user generates 5 items today (5/5)
2. Wait until midnight OR manually change system time
3. Cron job runs (check server logs)
4. Next day: Counter shows 0/5 again
5. User can generate 5 more items

### **Test Scenario 4: Backend API Testing**

```bash
# Check if user can generate
curl http://localhost:3001/api/generations/can-generate/1

# Get current count
curl http://localhost:3001/api/generations/count/1

# Increment count
curl -X POST http://localhost:3001/api/generations/increment \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "type": "image"}'
```

---

## 📁 Files Modified/Created

### **Backend:**
- ✅ `backend/routes/generations.js` (NEW) - Generation tracking routes
- ✅ `backend/server.js` (MODIFIED) - Added generations routes + cron job
- ✅ `backend/package.json` (MODIFIED) - Added `node-cron` dependency

### **Frontend:**
- ✅ `src/context/AppContext.tsx` (MODIFIED) - Async generation functions
- ✅ `src/services/api.ts` (MODIFIED) - Added generationAPI
- ✅ `src/pages/DashboardPage.tsx` (MODIFIED) - Integrated backend checks

### **Documentation:**
- ✅ `backend/migrations/create_generations_table.sql` (NEW) - Optional SQL
- ✅ `GENERATION_TRACKING_SYSTEM.md` (NEW) - This file

---

## 🚀 How to Run

### **1. Start Backend:**
```bash
cd backend
npm install
node server.js
```

Expected output:
```
========================================
🚀 SERVER STARTED
========================================
🌐 Running on: http://localhost:3001
📊 Database: ai_db
⏰ Cron Job: Active (Daily reset at 00:00 Africa/Cairo)
✅ Generation tracking: Using 'content' table
========================================
```

### **2. Start Frontend:**
```bash
npm run dev
```

### **3. Test the Flow:**
1. Login as a free user
2. Go to Dashboard
3. Generate content and watch the counter
4. Try to exceed 5 generations
5. Click "Upgrade to Premium"
6. Subscribe and become premium
7. Generate unlimited content! 🚀

---

## 🔧 Troubleshooting

### **Counter Not Updating:**
- Check browser console for API errors
- Verify backend is running on port 3001
- Check network tab for failed requests

### **Cron Job Not Running:**
- Check server logs at midnight
- Verify `node-cron` is installed: `npm list node-cron`
- Test manually: Call `/api/generations/reset-daily`

### **Premium Users Seeing Limits:**
- Check subscription table: `SELECT * FROM subscription WHERE UserID = ?`
- Verify `EndDate > NOW()` and `Status = 'active'`
- Check login response includes subscription data

### **Count Inaccurate:**
- Query content table directly:
  ```sql
  SELECT COUNT(*) FROM content 
  WHERE OwnerID = 1 AND DATE(DateCreated) = CURDATE();
  ```
- Compare with API response

---

## 📊 Monitoring & Analytics

### **Daily Statistics Query:**
```sql
-- Today's active users and generations
SELECT 
  COUNT(DISTINCT OwnerID) as active_users,
  COUNT(*) as total_generations,
  SUM(CASE WHEN ContentType = 'image' THEN 1 ELSE 0 END) as images,
  SUM(CASE WHEN ContentType = 'video' THEN 1 ELSE 0 END) as videos
FROM content 
WHERE DATE(DateCreated) = CURDATE();
```

### **Top Generators:**
```sql
SELECT 
  r.Username,
  COUNT(*) as generations_today
FROM content c
JOIN registereduser r ON c.OwnerID = r.UserID
WHERE DATE(c.DateCreated) = CURDATE()
GROUP BY r.Username
ORDER BY generations_today DESC
LIMIT 10;
```

### **Premium vs Free Stats:**
```sql
SELECT 
  CASE 
    WHEN s.SubscriptionID IS NOT NULL THEN 'Premium'
    ELSE 'Free'
  END as user_type,
  COUNT(DISTINCT c.OwnerID) as users,
  COUNT(*) as total_generations,
  ROUND(AVG(daily_count), 2) as avg_per_user
FROM (
  SELECT OwnerID, COUNT(*) as daily_count
  FROM content
  WHERE DATE(DateCreated) = CURDATE()
  GROUP BY OwnerID
) c
LEFT JOIN subscription s ON c.OwnerID = s.UserID 
  AND s.Status = 'active' 
  AND s.EndDate > NOW()
GROUP BY user_type;
```

---

## 🎯 Summary

✅ **System Complete!**

- Database tracking using existing `content` table
- Backend API routes for checking/incrementing
- Frontend integration with Context API
- Automatic daily reset at midnight
- Beautiful UI with limit modal
- Upgrade flow to premium
- All working perfectly! 🔥

**Your users now have:**
- Clear generation limits (5/day for free)
- Real-time counter display
- Smooth upgrade path to premium
- Unlimited generations for subscribers

🎊 **تمام يا زول! الشغل كلو جاهز!** 🎊
