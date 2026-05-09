const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due'], // Added past_due for payment failures
        default: 'active'
    },
    planType: {
        type: String,
        enum: ['starter', 'pro', 'premium'],
        required: true,
        default: 'starter'
    },
    stripeSubscriptionId: {
        type: String,
        required: false
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    planId: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Index for checking active subscriptions
subscriptionSchema.index({ userId: 1, status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
