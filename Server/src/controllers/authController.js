const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ok, fail } = require('../utils/response');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
}

async function register(req, res) {
  try {
    const { employeeId, fullName, email, phone, password, role = 'SALES', department = 'SALES' } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      return fail(res, 400, 'VALIDATION_FAILED', 'employeeId, fullName, email, and password are required');
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return fail(res, 409, 'DUPLICATE_FOUND', 'User with this email already exists');
    }

    const employeeIdExists = await User.findOne({ employeeId });
    if (employeeIdExists) {
      return fail(res, 409, 'DUPLICATE_FOUND', 'User with this Employee ID already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ employeeId, fullName, email, phone, passwordHash, role, department });

    return ok(res, { user: sanitizeUser(user), token: signToken(user) }, 201);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return fail(res, 409, 'DUPLICATE_FOUND', `User with this ${field} already exists`);
    }
    if (error.name === 'ValidationError') {
      return fail(res, 400, 'VALIDATION_FAILED', error.message);
    }
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return fail(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const matched = await bcrypt.compare(password || '', user.passwordHash);
    if (!matched) {
      user.failedLoginCount += 1;
      await user.save();
      return fail(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    user.failedLoginCount = 0;
    user.lastLoginAt = new Date();
    await user.save();

    return ok(res, { user: sanitizeUser(user), token: signToken(user) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function me(req, res) {
  return ok(res, { user: sanitizeUser(req.user) });
}

function sanitizeUser(user) {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.passwordHash;
  return plain;
}

module.exports = { register, login, me };



