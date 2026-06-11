const Payment = require('../models/Payment');
const Lead = require('../models/Lead');
const { ok, fail } = require('../utils/response');
const { recordAudit } = require('../utils/tracking');

async function createPayment(req, res) {
  try {
    // Only Admin and Accounts can create payments
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'ACCOUNTS') {
      return fail(res, 403, 'RBAC_FORBIDDEN', 'Access denied: Only Admin and Accounts can create payments');
    }

    const { leadId, dispatchId, totalAmount, advanceAmount = 0, dueDate, paymentStatus } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    const balanceAmount = Number(totalAmount || 0) - Number(advanceAmount || 0);
    const payment = await Payment.create({ 
      leadId, 
      dispatchId: dispatchId || null, 
      totalAmount: Number(totalAmount || 0), 
      advanceAmount: Number(advanceAmount || 0), 
      balanceAmount, 
      dueDate, 
      paymentStatus: paymentStatus || 'Not Started' 
    });

    await Lead.findByIdAndUpdate(leadId, { stage: 'PAYMENT_PENDING' });

    await recordAudit({
      actorId: req.user._id,
      actionType: 'PAYMENT_CREATED',
      entityType: 'PAYMENT',
      entityId: payment._id.toString(),
      metadata: { leadId, totalAmount, advanceAmount }
    });

    return ok(res, { payment }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listPayments(req, res) {
  try {
    let filter = {};
    
    // For non-admin, non-accounts: restrict payments to their own leads
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'ACCOUNTS') {
      const myLeads = await Lead.find({
        $or: [
          { assignedTo: req.user._id },
          { assignedDepartment: req.user.department }
        ]
      }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      filter.leadId = { $in: leadIds };
    }

    const payments = await Payment.find(filter).populate('leadId').sort({ createdAt: -1 });
    
    // Enforce RBAC: Sales Executive cannot see restricted financial fields
    const sanitized = payments.map(p => {
      const pObj = p.toObject();
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'ACCOUNTS') {
        delete pObj.totalAmount;
        delete pObj.advanceAmount;
        delete pObj.balanceAmount;
      }
      return pObj;
    });

    return ok(res, { payments: sanitized });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, 404, 'VALIDATION_FAILED', 'Payment not found');

    const lead = await Lead.findById(payment.leadId);
    
    // Check access: Admin, Accounts or the assigned sales executive
    const hasAccess = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'MANAGER' || 
      req.user.role === 'ACCOUNTS' || 
      (lead && lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString());

    if (!hasAccess) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only update payments for leads assigned to you');
    }

    // Update fields
    if (req.body.paymentStatus) {
      payment.paymentStatus = req.body.paymentStatus;
    }
    
    if (req.body.dueDate) {
      payment.dueDate = req.body.dueDate;
    }

    if (req.body.totalAmount !== undefined || req.body.advanceAmount !== undefined) {
      const total = req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : payment.totalAmount;
      const advance = req.body.advanceAmount !== undefined ? Number(req.body.advanceAmount) : payment.advanceAmount;
      payment.totalAmount = total;
      payment.advanceAmount = advance;
      payment.balanceAmount = total - advance;
    }

    // Handle document file uploads if present
    if (req.files) {
      const Document = require('../models/Document');
      const crypto = require('crypto');

      if (req.files.invoice && req.files.invoice[0]) {
        const file = req.files.invoice[0];
        const checksum = crypto.createHash('sha256').update(file.filename).digest('hex');
        const doc = await Document.create({
          ownerType: 'PAYMENT',
          ownerId: payment._id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          storagePath: file.path,
          uploadedBy: req.user._id,
          accessLevel: 'RESTRICTED',
          checksum,
          virusScanStatus: 'CLEAN'
        });
        payment.invoiceDocumentId = doc._id;
      }

      if (req.files.paymentProof && req.files.paymentProof[0]) {
        const file = req.files.paymentProof[0];
        const checksum = crypto.createHash('sha256').update(file.filename).digest('hex');
        const doc = await Document.create({
          ownerType: 'PAYMENT',
          ownerId: payment._id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          storagePath: file.path,
          uploadedBy: req.user._id,
          accessLevel: 'RESTRICTED',
          checksum,
          virusScanStatus: 'CLEAN'
        });
        payment.paymentProofDocumentId = doc._id;
      }
    }

    await payment.save();

    await recordAudit({
      actorId: req.user._id,
      actionType: 'PAYMENT_UPDATED',
      entityType: 'PAYMENT',
      entityId: payment._id.toString(),
      metadata: { status: payment.paymentStatus }
    });

    return ok(res, { payment });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listOutstandingPayments(req, res) {
  try {
    let filter = { paymentStatus: { $ne: 'Paid' } };

    // For non-admin, non-accounts: restrict outstanding payments to their own leads
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'ACCOUNTS') {
      const myLeads = await Lead.find({
        $or: [
          { assignedTo: req.user._id },
          { assignedDepartment: req.user.department }
        ]
      }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      filter.leadId = { $in: leadIds };
    }

    const payments = await Payment.find(filter).populate('leadId').sort({ createdAt: -1 });

    // Enforce RBAC: Sales Executive cannot see restricted financial fields
    const sanitized = payments.map(p => {
      const pObj = p.toObject();
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'ACCOUNTS') {
        delete pObj.totalAmount;
        delete pObj.advanceAmount;
        delete pObj.balanceAmount;
      }
      return pObj;
    });

    return ok(res, { payments: sanitized });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function triggerReminder(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, 404, 'VALIDATION_FAILED', 'Payment record not found');

    const lead = await Lead.findById(payment.leadId);
    
    // Access check: Admin, Accounts or assigned sales executive
    const hasAccess = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'MANAGER' || 
      req.user.role === 'ACCOUNTS' || 
      (lead && lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString());

    if (!hasAccess) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: Unauthorized to trigger reminders for this payment');
    }

    payment.reminderCount = (payment.reminderCount || 0) + 1;
    payment.lastReminderAt = new Date();
    await payment.save();

    await recordAudit({
      actorId: req.user._id,
      actionType: 'PAYMENT_REMINDER_SENT',
      entityType: 'PAYMENT',
      entityId: payment._id.toString(),
      metadata: { reminderCount: payment.reminderCount }
    });

    return ok(res, { payment, message: 'Payment reminder triggered successfully' });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createPayment,
  listPayments,
  updatePaymentStatus,
  listOutstandingPayments,
  triggerReminder
};
