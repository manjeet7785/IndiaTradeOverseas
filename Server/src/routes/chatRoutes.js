const router = require('express').Router();
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { ok, fail } = require('../utils/response');

// ================= PUBLIC ENDPOINTS =================

// Initialize a new chat session
router.post('/sessions', async (req, res) => {
  try {
    const { clientName, clientEmail } = req.body;
    if (!clientName) {
      return fail(res, 400, 'VALIDATION_FAILED', 'clientName is required');
    }

    const sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    const session = await ChatSession.create({
      sessionId,
      clientName,
      clientEmail: clientEmail || ''
    });

    // Create a system welcome message
    await ChatMessage.create({
      sessionId,
      sender: 'SYSTEM',
      senderName: 'ITO Trade Assistant',
      message: `Hello ${clientName}! Welcome to India Trade Overseas support desk. How can we help you with natural stones, coal, tea, or rice commodity sourcing today?`
    });

    return ok(res, { session }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Fetch message history for a session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return fail(res, 404, 'VALIDATION_FAILED', 'Session not found');
    }

    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    return ok(res, { session, messages });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Send a message from the client
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    if (!message) {
      return fail(res, 400, 'VALIDATION_FAILED', 'Message content is required');
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return fail(res, 404, 'VALIDATION_FAILED', 'Session not found');
    }

    if (session.status === 'RESOLVED') {
      session.status = 'OPEN'; // Reopen if they message again
    }
    session.lastMessageAt = new Date();
    await session.save();

    const clientMsg = await ChatMessage.create({
      sessionId,
      sender: 'CLIENT',
      senderName: session.clientName,
      message
    });

    // Automated fallback responder to simulate immediate response
    const msgLower = message.toLowerCase();
    let autoReply = "";

    if (msgLower.includes('stone') || msgLower.includes('granite') || msgLower.includes('marble')) {
      autoReply = "Our Natural Stones category includes premium Granite, Marble, Slate, and Sandstone processed directly at our quarries in India. I have logged your interest and our stones procurement manager will get in touch shortly.";
    } else if (msgLower.includes('coal')) {
      autoReply = "We trade high-grade thermal and industrial coal. Our sales desk will need your estimated monthly volume to provide CIF port pricing.";
    } else if (msgLower.includes('tea')) {
      autoReply = "ITO exports premium Orthodox and CTC tea from selected Assam and Darjeeling estates. Let us know if you require sample grades.";
    } else if (msgLower.includes('rice')) {
      autoReply = "We ship certified long-grain Basmati and premium non-basmati rice globally. Standard package sizes are 20kg and 50kg PP bags.";
    } else if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
      autoReply = "Hello! Let us know what commodities you are interested in sourcing, and we will prepare a commercial quotation for you.";
    }

    if (autoReply) {
      // Create a slight delay simulation or immediate database record
      await ChatMessage.create({
        sessionId,
        sender: 'SYSTEM',
        senderName: 'ITO Trade Assistant',
        message: autoReply
      });
    }

    return ok(res, { message: clientMsg });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ================= ADMIN/MANAGER ENDPOINTS =================

// List all chat sessions
router.get('/admin/sessions', auth, rbac('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const sessions = await ChatSession.find().sort({ lastMessageAt: -1 });
    return ok(res, { sessions });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Admin sends a message reply
router.post('/admin/sessions/:sessionId/messages', auth, rbac('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    if (!message) {
      return fail(res, 400, 'VALIDATION_FAILED', 'Message content is required');
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return fail(res, 404, 'VALIDATION_FAILED', 'Session not found');
    }

    session.lastMessageAt = new Date();
    await session.save();

    const adminMsg = await ChatMessage.create({
      sessionId,
      sender: 'ADMIN',
      senderName: req.user.fullName,
      message
    });

    return ok(res, { message: adminMsg });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Resolve support session
router.patch('/admin/sessions/:sessionId/resolve', auth, rbac('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      { status: 'RESOLVED' },
      { new: true }
    );

    if (!session) {
      return fail(res, 404, 'VALIDATION_FAILED', 'Session not found');
    }

    await ChatMessage.create({
      sessionId,
      sender: 'SYSTEM',
      senderName: 'System',
      message: 'This support chat session has been resolved. Thank you for contacting India Trade Overseas.'
    });

    return ok(res, { session });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

module.exports = router;
