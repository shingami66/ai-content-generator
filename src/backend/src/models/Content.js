const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 255
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['image', 'video', 'text', 'other'],
        default: 'other'
    },
    description: {
        type: String
    },
    url: {
        type: String
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for better performance (matching old SQL indexes)
contentSchema.index({ ownerId: 1, dateCreated: -1 });
contentSchema.index({ contentType: 1 });

module.exports = mongoose.model('Content', contentSchema);
