const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Mapping to old ID if needed, though we'll use _id mostly
    // We can keep a specific field for legacy IDs if we migrate data
    legacyId: { type: Number },
    googleId: { type: String, unique: true, sparse: true },
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: false, // Optional for Google users
        maxlength: 255
    },
    managedByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    // Tracking for Free Users
    generationsToday: {
        type: Number,
        default: 0
    },
    // Tracking for Paid Users (Monthly)
    generationsMonthly: {
        type: Number,
        default: 0
    },
    // Cached Subscription Info
    subscriptionType: {
        type: String,
        enum: ['free', 'starter', 'pro', 'premium'],
        default: 'free'
    },
    generationsLimit: {
        type: Number,
        default: 5
    },
    lastGenerationDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for email - removed as unique: true already creates an index
// userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
