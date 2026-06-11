const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    clientName: {
      type: String,
      required: true
    },
    clientEmail: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED'],
      default: 'OPEN'
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
