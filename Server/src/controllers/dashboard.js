const Lead = require('../models/Lead');
const User = require('../models/User');
const Quotation = require('../models/Quotation');
const SecurityAlert = require('../models/SecurityAlert');
const Notification = require('../models/Notification');
const LeadActivity = require('../models/LeadActivity');
const { ok, fail } = require('../utils/response');
const { getLeadDisplay } = require('../utils/workflow');
const { recordAudit } = require('../utils/tracking');

// Dashboard Summary
async function dashboardSummary(req, res) {
  try {
    const stageCounts = await Lead.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);
    const users = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const openAlerts = await SecurityAlert.countDocuments({ status: 'OPEN' });
    const pendingQuotations = await Quotation.countDocuments({ status: 'PENDING' });

    return ok(res, {
      summary: {
        users,
        activeUsers,
        openAlerts,
        pendingQuotations,
        stageCounts: stageCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Pipeline data
async function pipeline(req, res) {
  try {
    const data = await Lead.aggregate([
      { $group: { _id: '$stage', total: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    return ok(res, { pipeline: data });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Employee Performance
async function employeePerformance(req, res) {
  try {
    const data = await Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          leads: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$stage', 'CLOSED_WON'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$stage', 'CLOSED_LOST'] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $ifNull: ['$userInfo.fullName', '$_id'] },
          leads: 1,
          won: 1,
          lost: 1
        }
      }
    ]);
    return ok(res, { performance: data });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Security Alerts
async function securityAlerts(req, res) {
  try {
    const alerts = await SecurityAlert.find()
      .populate('actorId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(100);
    return ok(res, { alerts });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Quotation Queue
async function quotationQueue(req, res) {
  try {
    const quotations = await Quotation.find({ status: 'PENDING' })
      .populate('leadId')
      .populate('requestedBy', 'fullName')
      .sort({ createdAt: -1 });
    return ok(res, { quotations });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Assign Lead (Admin)
async function assignLead(req, res) {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.leadId,
      {
        assignedTo: req.body.assignedTo || null,
        assignedDepartment: req.body.assignedDepartment || null,
        stage: req.body.stage || undefined
      },
      { new: true }
    );

    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'ADMIN_LEAD_ASSIGN',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      severity: 'LOW',
      metadata: req.body
    });

    const assignmentMessage = req.body.assignedTo
      ? `You have been assigned lead ${lead.leadCode || lead._id} by admin.`
      : `A new lead ${lead.leadCode || lead._id} has been routed to ${req.body.assignedDepartment || 'a department'} by admin.`;

    if (req.body.assignedTo) {
      await Notification.create({
        targetUserId: req.body.assignedTo,
        message: assignmentMessage,
        type: 'TASK_ASSIGNMENT',
        metadata: { leadId: lead._id, assignedDepartment: req.body.assignedDepartment }
      });
    }

    if (req.body.assignedDepartment) {
      await Notification.create({
        targetDepartment: req.body.assignedDepartment,
        message: assignmentMessage,
        type: 'TASK_ASSIGNMENT',
        metadata: { leadId: lead._id, assignedTo: req.body.assignedTo }
      });
    }

    return ok(res, { lead: getLeadDisplay(lead) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Deactivate User
async function deactivateUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: user._id.toString(),
      severity: 'MEDIUM',
      metadata: { deactivatedBy: req.user?.fullName }
    });

    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Update Export Permission
async function exportPermission(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { exportPermission: Boolean(req.body.exportPermission) },
      { new: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// User Dashboard Summary (Both Admin and Non-Admin)
async function userDashboardSummary(req, res) {
  try {
    if (req.user.role === 'ADMIN') {
      const stageCounts = await Lead.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]);
      const users = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const openAlerts = await SecurityAlert.countDocuments({ status: 'OPEN' });
      const pendingQuotations = await Quotation.countDocuments({ status: 'PENDING' });

      return ok(res, {
        role: 'ADMIN',
        summary: {
          users,
          activeUsers,
          openAlerts,
          pendingQuotations,
          stageCounts: stageCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } else {
      const myLeadsCount = await Lead.countDocuments({ assignedTo: req.user._id });
      const activeLeadsCount = await Lead.countDocuments({
        assignedTo: req.user._id,
        stage: { $nin: ['CLOSED_WON', 'CLOSED_LOST'] }
      });
      const closedWonCount = await Lead.countDocuments({
        assignedTo: req.user._id,
        stage: 'CLOSED_WON'
      });

      const myLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      const pendingQuotations = await Quotation.countDocuments({
        leadId: { $in: leadIds },
        status: 'PENDING'
      });

      const stageCounts = await Lead.aggregate([
        { $match: { assignedTo: req.user._id } },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]);

      return ok(res, {
        role: req.user.role,
        summary: {
          totalLeads: myLeadsCount,
          activeLeads: activeLeadsCount,
          completedTasks: closedWonCount,
          pendingQuotations,
          stageCounts: stageCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    }
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// User Action History
async function userHistory(req, res) {
  try {
    const query = req.user.role === 'ADMIN' ? {} : { actorId: req.user._id };
    const activities = await LeadActivity.find(query)
      .populate('leadId', 'customerName leadCode')
      .populate('actorId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(100);

    return ok(res, { activities });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function getNotifications(req, res) {
  try {
    const query = {
      $or: [
        { targetUserId: req.user._id },
        { targetRole: req.user.role },
        { targetDepartment: req.user.department }
      ]
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return ok(res, { notifications });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function markNotificationRead(req, res) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) return fail(res, 404, 'VALIDATION_FAILED', 'Notification not found');

    return ok(res, { notification });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Delete User (Employee)
async function deleteUser(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Only admin can delete employees');
    }
    const user = await User.findById(req.params.userId);
    if (!user) return fail(res, 404, 'VALIDATION_FAILED', 'User not found');

    await User.findByIdAndDelete(req.params.userId);
    // Unassign leads assigned to this user
    await Lead.updateMany({ assignedTo: req.params.userId }, { $set: { assignedTo: null } });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'USER_DELETED',
      entityType: 'USER',
      entityId: user._id.toString(),
      severity: 'HIGH',
      metadata: { deletedBy: req.user?.fullName, employeeId: user.employeeId, fullName: user.fullName }
    });

    return ok(res, { message: 'User deleted successfully' });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

// Delete Lead (Task)
async function deleteLead(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Only admin can delete tasks');
    }
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    await Lead.findByIdAndDelete(req.params.leadId);
    // Delete related activities
    await LeadActivity.deleteMany({ leadId: req.params.leadId });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'LEAD_DELETED',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      severity: 'HIGH',
      metadata: { deletedBy: req.user?.fullName, leadCode: lead.leadCode }
    });

    return ok(res, { message: 'Lead deleted successfully' });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  dashboardSummary,
  pipeline,
  employeePerformance,
  securityAlerts,
  quotationQueue,
  assignLead,
  deactivateUser,
  exportPermission,
  userDashboardSummary,
  userHistory,
  getNotifications,
  markNotificationRead,
  deleteUser,
  deleteLead
};