const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TrustedDevice = require('../models/TrustedDevice');
const { ok, fail } = require('../utils/response');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET || 'ito-task-secret', {
    expiresIn: '1d'
  });
}

async function register(req, res) {
  try {
    let { employeeId, fullName, email, phone, password, role, department } = req.body;

    if (!role) role = 'SALES';
    if (!department) department = 'SALES';

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

    return ok(res, { 
      user: sanitizeUser(user), 
      token: signToken(user)
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp, deviceHash } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return fail(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or session');
    }

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return fail(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid or expired OTP');
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    let requiresDeviceApproval = false;
    if (deviceHash) {
      const device = await TrustedDevice.findOne({ userId: user._id, deviceHash });
      if (!device || !device.isApproved) {
        requiresDeviceApproval = true;
      }
    } else {
      requiresDeviceApproval = true;
    }

    return ok(res, { 
      user: sanitizeUser(user), 
      token: signToken(user),
      requiresDeviceApproval 
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return ok(res, { otp, message: 'OTP sent successfully (Demo Mode)' });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function getSessions(req, res) {
  try {
    const devices = await TrustedDevice.find({ userId: req.user._id });
    return ok(res, { devices });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function requestDeviceApproval(req, res) {
  try {
    const { deviceHash, deviceName, ipAddress } = req.body;
    if (!deviceHash) return fail(res, 400, 'VALIDATION_FAILED', 'deviceHash is required');

    let device = await TrustedDevice.findOne({ userId: req.user._id, deviceHash });
    if (!device) {
      device = await TrustedDevice.create({
        userId: req.user._id,
        deviceHash,
        deviceName: deviceName || 'Unknown Device',
        ipAddress: ipAddress || req.ip || '',
        isApproved: false
      });
    }
    return ok(res, { device, message: 'Device approval request submitted.' });
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
  delete plain.otp;
  delete plain.otpExpires;
  return plain;
}

module.exports = { register, login, verifyOtp, requestOtp, getSessions, requestDeviceApproval, me };




