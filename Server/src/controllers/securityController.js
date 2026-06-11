const Lead = require('../models/Lead');
const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const { decryptText } = require('../utils/crypto');
const { ok, fail } = require('../utils/response');
const { canAccessLead } = require('../utils/workflow');
const { recordAudit, raiseAlert } = require('../utils/tracking');

const windowMap = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const bucket = windowMap.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  windowMap.set(key, recent);
  return recent.length > 5;
}

async function reveal(req, res) {
  try {
    const { entityType, entityId, fieldName, reason, deviceHash = '' } = req.body;
    if (entityType !== 'LEAD' && entityType !== 'DISPATCH') {
      return fail(res, 400, 'VALIDATION_FAILED', 'Only LEAD and DISPATCH reveal is supported');
    }

    if (entityType === 'DISPATCH') {
      const Dispatch = require('../models/Dispatch');
      const dispatch = await Dispatch.findById(entityId);
      if (!dispatch) return fail(res, 404, 'VALIDATION_FAILED', 'Dispatch not found');

      const lead = await Lead.findById(dispatch.leadId);
      if (!lead || !canAccessLead(req.user, lead)) {
        await raiseAlert({
          actorId: req.user._id,
          alertType: 'OWNERSHIP_FORBIDDEN',
          severity: 'HIGH',
          message: 'Unauthorized dispatch reveal attempt',
          metadata: { entityType, entityId, fieldName, deviceHash, reason }
        });
        await recordAudit({
          actorId: req.user._id,
          actionType: 'REVEAL_DENIED',
          entityType,
          entityId,
          severity: 'HIGH',
          deviceHash,
          metadata: { fieldName, reason }
        });
        return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied');
      }

      let value = null;
      if (['driverphone', 'driver_phone', 'driverphoneencrypted', 'phone'].includes(String(fieldName).toLowerCase())) {
        value = decryptText(dispatch.driverPhoneEncrypted);
      } else {
        return fail(res, 400, 'VALIDATION_FAILED', 'Unsupported field');
      }

      await recordAudit({
        actorId: req.user._id,
        actionType: `${String(fieldName).toUpperCase()}_REVEAL`,
        entityType,
        entityId,
        severity: 'MEDIUM',
        deviceHash,
        metadata: { fieldName, reason }
      });

      return ok(res, { value });
    }

    const lead = await Lead.findById(entityId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    const rateKey = `${req.user._id}:${deviceHash}:${entityId}:${fieldName}`;
    if (isRateLimited(rateKey)) {
      await raiseAlert({
        actorId: req.user._id,
        alertType: 'RATE_LIMITED',
        severity: 'HIGH',
        message: 'Too many reveal attempts',
        metadata: { entityType, entityId, fieldName, deviceHash }
      });
      return fail(res, 429, 'RATE_LIMITED', 'Too many requests');
    }

    if (!canAccessLead(req.user, lead)) {
      await raiseAlert({
        actorId: req.user._id,
        alertType: 'OWNERSHIP_FORBIDDEN',
        severity: 'HIGH',
        message: 'Unauthorized reveal attempt',
        metadata: { entityType, entityId, fieldName, deviceHash, reason }
      });
      await recordAudit({
        actorId: req.user._id,
        actionType: 'REVEAL_DENIED',
        entityType,
        entityId,
        severity: 'HIGH',
        deviceHash,
        metadata: { fieldName, reason }
      });
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied');
    }

    let value = null;
    if (['mobile', 'phone'].includes(String(fieldName).toLowerCase())) {
      value = decryptText(lead.phoneEncrypted);
    } else if (['email'].includes(String(fieldName).toLowerCase())) {
      value = decryptText(lead.emailEncrypted);
    } else {
      return fail(res, 400, 'VALIDATION_FAILED', 'Unsupported field');
    }

    await recordAudit({
      actorId: req.user._id,
      actionType: `${String(fieldName).toUpperCase()}_REVEAL`,
      entityType,
      entityId,
      severity: 'MEDIUM',
      deviceHash,
      metadata: { fieldName, reason }
    });

    return ok(res, { value });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function logs(req, res) {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(Number(req.query.limit || 100));
    return ok(res, { logs });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function alerts(req, res) {
  try {
    const alerts = await SecurityAlert.find().sort({ createdAt: -1 }).limit(Number(req.query.limit || 100));
    return ok(res, { alerts });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function exportAttempt(req, res) {
  try {
    const { deviceHash = '', metadata = {} } = req.body;
    const hasPermission = req.user.exportPermission === true || req.user.role === 'ADMIN';

    await recordAudit({
      actorId: req.user._id,
      actionType: 'EXPORT_ATTEMPT',
      entityType: 'LEAD',
      entityId: 'ALL_LEADS',
      severity: hasPermission ? 'LOW' : 'CRITICAL',
      deviceHash,
      metadata: { ...metadata, hasPermission }
    });

    if (!hasPermission) {
      await raiseAlert({
        actorId: req.user._id,
        alertType: 'UNAUTHORIZED_EXPORT_ATTEMPT',
        severity: 'CRITICAL',
        message: `${req.user.fullName} (${req.user.employeeId}) tried to export leads database without export permission.`,
        metadata: { deviceHash, ...metadata }
      });
      return fail(res, 403, 'UNAUTHORIZED_EXPORT', 'Access denied: You do not have permission to export data.');
    }

    return ok(res, { success: true, message: 'Export allowed' });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = { reveal, logs, alerts, exportAttempt };