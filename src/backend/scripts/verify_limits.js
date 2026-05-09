const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:3001/api';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

async function runTest() {
    try {
        console.log('🚀 Starting Tier Limit & Reset Verification...');

        // 1. Create a Test User
        const testEmail = `tier_test_${Date.now()}@example.com`;
        const password = 'Password123!';

        console.log(`\n1. Registering user: ${testEmail}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username: 'TierTester',
            email: testEmail,
            password: password
        });
        const userId = regRes.data.userId;
        console.log(`   User registered: ${userId}`);

        // Login to get token
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: password
        });
        const token = loginRes.data.token;
        console.log(`   Logged in, token received.`);

        // 2. Mock a Pro Subscription (Limit: 500)
        console.log(`\n2. Creating Mock Pro Subscription...`);
        await Subscription.deleteMany({ userId: userId });

        const sub = new Subscription({
            userId: userId,
            planType: 'pro',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await sub.save();
        console.log(`   Pro Subscription created.`);

        // 3. Test Limit Enforcement
        console.log(`\n3. Testing Limit Enforcement...`);
        // Manually set usage to 499 (Limit 500)
        await User.findByIdAndUpdate(userId, {
            generationsMonthly: 499,
            lastGenerationDate: new Date()
        });
        console.log(`   Set generationsMonthly to 499.`);

        // Request 500th generation (Should Succeed)
        console.log(`   Attempting generation #500...`);
        try {
            await axios.post(`${API_URL}/content/generate`, {
                userId,
                type: 'image',
                description: 'Test generation 500' // Short prompt
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log(`   ✅ Generation #500 SUCCEEDED (Expected)`);
        } catch (err) {
            console.error(`   ❌ Generation #500 FAILED:`, err.response?.data || err.message);
        }

        // Request 501st generation (Should Fail)
        console.log(`   Attempting generation #501...`);
        try {
            await axios.post(`${API_URL}/content/generate`, {
                userId,
                type: 'image',
                description: 'Test generation 501'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log(`   ❌ Generation #501 SUCCEEDED (Unexpected!)`);
        } catch (err) {
            if (err.response?.status === 429) {
                console.log(`   ✅ Generation #501 FAILED with 429 (Expected)`);
            } else {
                console.error(`   ❌ Generation #501 FAILED with Status ${err.response?.status} (Unexpected):`, err.response?.data);
            }
        }

        // 4. Test Monthly Reset Logic
        console.log(`\n4. Testing Monthly Reset Logic...`);
        // Set date to last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        await User.findByIdAndUpdate(userId, {
            generationsMonthly: 500, // Still at limit
            lastGenerationDate: lastMonth // But date is old
        });
        console.log(`   Set generationsMonthly to 500, lastGenerationDate to last month.`);

        // Next generation should trigger reset and succeed
        console.log(`   Attempting generation (should trigger reset)...`);
        try {
            await axios.post(`${API_URL}/content/generate`, {
                userId,
                type: 'image',
                description: 'Test generation reset'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log(`   ✅ Generation after reset SUCCEEDED (Expected)`);

            // Verify DB
            const updatedUser = await User.findById(userId);
            console.log(`   User generationsMonthly: ${updatedUser.generationsMonthly} (Expected: 1)`);
            if (updatedUser.generationsMonthly === 1) {
                console.log('   ✅ Database verification passed!');
            } else {
                console.log('   ❌ Database verification failed!');
            }

        } catch (err) {
            console.error(`   ❌ Generation after reset FAILED:`, err.response?.data || err.message);
        }

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\nTest Complete.');
        process.exit();
    }
}

runTest();
