const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TrustedDevice = require('../models/TrustedDevice');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, errorCode: 'AUTH_INVALID_CREDENTIALS', message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'ito-task-secret');
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, errorCode: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid user' });
    }



    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, errorCode: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid token' });
  }
}

module.exports = auth;





