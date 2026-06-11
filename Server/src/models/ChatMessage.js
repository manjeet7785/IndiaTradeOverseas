const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    sender: {
      type: String,
      enum: ['CLIENT', 'ADMIN', 'SYSTEM'],
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
