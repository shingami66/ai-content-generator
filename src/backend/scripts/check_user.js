const mongoose = require('mongoose');
const User = require('../src/models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'test_concurrency_1770699254585@example.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User Found:', user.email);
            console.log('Generations Today:', user.generationsToday);
            console.log('Last Generation Date:', user.lastGenerationDate);
            console.log('Subscription Type:', user.subscriptionType); // Virtual or undefined
        } else {
            console.log('User not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
