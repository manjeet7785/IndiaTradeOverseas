const Payment = require('../models/Payment');
const Lead = require('../models/Lead');
const { ok, fail } = require('../utils/response');

async function createPayment(req, res) {
  try {
    const { leadId, dispatchId, totalAmount, advanceAmount = 0, dueDate } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    if (req.user.role !== 'ADMIN' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only record payments for leads assigned to you');
    }

    const balanceAmount = Number(totalAmount || 0) - Number(advanceAmount || 0);
    const payment = await Payment.create({ leadId, dispatchId, totalAmount, advanceAmount, balanceAmount, dueDate });
    await Lead.findByIdAndUpdate(leadId, { stage: 'PAYMENT_PENDING' });
    return ok(res, { payment }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listPayments(req, res) {
  try {
    let filter = {};
    if (req.user.role !== 'ADMIN') {
      const myLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      filter.leadId = { $in: leadIds };
    }
    const payments = await Payment.find(filter).populate('leadId').sort({ createdAt: -1 });
    return ok(res, { payments });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, 404, 'VALIDATION_FAILED', 'Payment not found');

    const lead = await Lead.findById(payment.leadId);
    if (lead && req.user.role !== 'ADMIN' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only update payments for leads assigned to you');
    }

    payment.paymentStatus = req.body.paymentStatus;
    await payment.save();

    return ok(res, { payment });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createPayment,
  listPayments,
  updatePaymentStatus
};




