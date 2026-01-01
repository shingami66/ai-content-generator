# Google OAuth Integration - Quick Start Guide

## ✅ What's Done:

Google OAuth has been fully integrated into your backend! Here's what was added:

### Backend Changes:
1. ✅ Installed: `passport`, `passport-google-oauth20`, `express-session`
2. ✅ Created: `config/passport.js` - Google OAuth strategy
3. ✅ Updated: `routes/auth.js` - Added Google auth endpoints
4. ✅ Updated: `server.js` - Added session & passport middleware
5. ✅ Updated: `.env` - Added Google OAuth configuration

### Frontend Changes:
1. ✅ Updated: `AuthenticationPage.tsx` - Google button redirects to OAuth
2. ✅ Created: `GoogleCallback.tsx` - Handles OAuth callback
3. ✅ Updated: `App.tsx` - Added callback route
4. ✅ Updated: `api.ts` - Added Google verification endpoint

---

## 🚀 How to Set Up (3 Steps):

### Step 1: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Navigate to: **APIs & Services** > **Credentials**
4. Click: **Create Credentials** > **OAuth client ID**
5. Select: **Web application**
6. Fill in:
   - **Name**: `AI Create Studio`
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3001/api/auth/google/callback
     http://localhost:3000/auth/callback
     ```
7. Click **Create**
8. **COPY** your Client ID and Client Secret

### Step 2: Update Backend Configuration

Open `backend/.env` and replace:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

With your **actual** credentials from Step 1.

### Step 3: Update Database (Optional)

If your `registereduser` table doesn't have a `google_id` column, add it:

```sql
ALTER TABLE `registereduser` 
ADD COLUMN `google_id` VARCHAR(255) NULL AFTER `password`;
```

---

## 🎯 How It Works:

### User Flow:
1. User clicks "Continue with Google" button
2. Redirected to Google OAuth consent screen
3. User authorizes the app
4. Google redirects to: `http://localhost:3001/api/auth/google/callback`
5. Backend:
   - Receives user info (email, name, Google ID)
   - Checks if user exists in `registereduser` table
   - Creates new user if doesn't exist
   - Returns user data
6. Frontend receives user data and logs them in
7. User redirected to Dashboard

### API Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Handle Google callback |
| POST | `/api/auth/google/verify` | Verify Google user |

---

## 🧪 Testing:

### 1. Make sure both servers are running:

**Backend:**
```bash
cd backend
npm run dev
```
Server should be on: http://localhost:3001

**Frontend:**
```bash
npm run dev
```
Server should be on: http://localhost:3000

### 2. Test Google Login:

1. Go to: http://localhost:3000/login
2. Click "Continue with Google" button
3. Select your Google account
4. Authorize the app
5. You should be redirected to Dashboard
6. Check your database - new user should be in `registereduser` table

---

## 🔍 Troubleshooting:

### Error: "redirect_uri_mismatch"
**Solution**: Make sure the callback URL in Google Console EXACTLY matches:
```
http://localhost:3001/api/auth/google/callback
```

### Error: "Invalid client"
**Solution**: 
1. Check CLIENT_ID and CLIENT_SECRET in `.env`
2. Make sure there are no extra spaces
3. Restart backend server: `npm run dev`

### User not created in database
**Solution**:
1. Check MySQL is running (XAMPP/WAMP)
2. Verify database `ai_db` exists
3. Check `registereduser` table exists
4. Look at backend console for error messages

### Can't login / Nothing happens
**Solution**:
1. Open browser console (F12)
2. Check for CORS errors
3. Verify both frontend and backend are running
4. Check `.env` file has correct credentials

---

## 🔒 Security Notes:

For **Production**:
- ✅ Use HTTPS (update redirect URIs)
- ✅ Change SESSION_SECRET to strong random value
- ✅ Set `secure: true` in session cookie config
- ✅ Update CORS to only allow your production domain
- ✅ NEVER commit `.env` to git

---

## 📝 Database Schema:

Your `registereduser` table should have:

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| username | VARCHAR(255) | User's name |
| email | VARCHAR(255) | User's email (unique) |
| password | VARCHAR(255) | Password (or 'google-oauth') |
| google_id | VARCHAR(255) | Google user ID (optional) |

---

## ✨ Features:

- ✅ One-click Google login
- ✅ Auto-create user account
- ✅ Auto-login after OAuth
- ✅ Secure session management
- ✅ Works with existing email/password login

---

Need help? Check the backend console for detailed error messages!
