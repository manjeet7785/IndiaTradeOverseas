const router = require('express').Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const User = require('../models/User');
const { dashboardSummary, pipeline, employeePerformance, securityAlerts, quotationQueue, assignLead, deactivateUser, exportPermission, deleteUser, deleteLead } = require('../controllers/dashboard');
const { adminSummary } = require('../controllers/adminController');
const { ok, fail } = require('../utils/response');

// Admin dashboard routes - all routes require authentication and admin/manager role
router.use(auth, rbac('ADMIN', 'MANAGER'));

// ============= DASHBOARD ROUTES =============
router.get('/dashboard/summary', dashboardSummary);
router.get('/dashboard/pipeline', pipeline);
router.get('/dashboard/employee-performance', employeePerformance);
router.get('/dashboard/security-alerts', securityAlerts);
router.get('/dashboard/quotation-queue', quotationQueue);

// ============= USER MANAGEMENT ROUTES =============

// Get all users (for admin panel)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return ok(res, { users });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Get single user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash');
    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Deactivate user (soft delete)
router.patch('/users/:userId/deactivate', deactivateUser);

// Activate user (reactivate)
router.patch('/users/:userId/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Update user role
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return fail(res, 400, 'VALIDATION_FAILED', 'Role is required');

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Update user department
router.patch('/users/:userId/department', async (req, res) => {
  try {
    const { department } = req.body;
    if (!department) return fail(res, 400, 'VALIDATION_FAILED', 'Department is required');

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { department },
      { new: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Update export permission
router.patch('/users/:userId/export-permission', exportPermission);

// Delete user (employee)
router.delete('/users/:userId', deleteUser);

// ============= LEAD MANAGEMENT ROUTES =============

// Assign lead to user
router.patch('/leads/:leadId/assign', assignLead);

// Delete lead (task)
router.delete('/leads/:leadId', deleteLead);

// Get all leads (admin view)
router.get('/leads', async (req, res) => {
  try {
    const Lead = require('../models/Lead');
    const { getLeadDisplay } = require('../utils/workflow');

    const leads = await Lead.find()
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(500);

    return ok(res, { leads: leads.map(lead => getLeadDisplay(lead)) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Get lead statistics
router.get('/leads/stats', async (req, res) => {
  try {
    const Lead = require('../models/Lead');

    const totalLeads = await Lead.countDocuments();
    const stageStats = await Lead.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);
    const sourceStats = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    return ok(res, {
      stats: {
        totalLeads,
        stageDistribution: stageStats,
        sourceDistribution: sourceStats
      }
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= SECURITY ROUTES =============

// Get all security alerts
router.get('/security/alerts', async (req, res) => {
  try {
    const SecurityAlert = require('../models/SecurityAlert');
    const alerts = await SecurityAlert.find()
      .populate('actorId', 'fullName email')
      .sort({ createdAt: -1 });

    return ok(res, { alerts });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Resolve security alert
router.patch('/security/alerts/:alertId/resolve', async (req, res) => {
  try {
    const SecurityAlert = require('../models/SecurityAlert');
    const alert = await SecurityAlert.findByIdAndUpdate(
      req.params.alertId,
      { status: 'RESOLVED', reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );

    if (!alert) return fail(res, 404, 'VALIDATION_FAILED', 'Alert not found');
    return ok(res, { alert });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const limit = parseInt(req.query.limit) || 100;
    const logs = await AuditLog.find()
      .populate('actorId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit);

    return ok(res, { logs });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= REPORT ROUTES =============

// Admin summary report
router.get('/report/summary', adminSummary);

// Generate custom report
router.post('/report/custom', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.body;
    const Lead = require('../models/Lead');

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let data = {};

    if (type === 'leads' || !type) {
      data.leads = await Lead.find(query).sort({ createdAt: -1 });
    }

    if (type === 'performance' || !type) {
      data.performance = await Lead.aggregate([
        { $match: { assignedTo: { $ne: null }, ...query } },
        {
          $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$stage', 'CLOSED_WON'] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$stage', 'CLOSED_LOST'] }, 1, 0] } }
          }
        }
      ]);
    }

    if (type === 'stages' || !type) {
      data.stages = await Lead.aggregate([
        { $match: query },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]);
    }

    return ok(res, {
      report: data,
      filters: { startDate, endDate, type },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= SYSTEM ROUTES =============

// System health check (admin only)
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    return ok(res, {
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= QUOTATION MANAGEMENT =============

// Get all quotations (admin view)
router.get('/quotations', async (req, res) => {
  try {
    const Quotation = require('../models/Quotation');
    const quotations = await Quotation.find()
      .populate('leadId', 'customerName leadCode')
      .populate('requestedBy', 'fullName')
      .sort({ createdAt: -1 });

    return ok(res, { quotations });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= DISPATCH MANAGEMENT =============

// Get all dispatches (admin view)
router.get('/dispatches', async (req, res) => {
  try {
    const Dispatch = require('../models/Dispatch');
    const dispatches = await Dispatch.find()
      .populate('leadId', 'customerName leadCode')
      .sort({ createdAt: -1 });

    return ok(res, { dispatches });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

// ============= PAYMENT MANAGEMENT =============

// Get all payments (admin view)
router.get('/payments', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find()
      .populate('leadId', 'customerName leadCode')
      .sort({ createdAt: -1 });

    return ok(res, { payments });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
});

module.exports = router;