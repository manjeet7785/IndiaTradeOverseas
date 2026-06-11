const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const { ok, fail } = require('../utils/response');
const { recordAudit } = require('../utils/tracking');

async function requestQuotation(req, res) {
  try {
    const { leadId, employeeRequestedPrice, marginNote, paymentTerms, validityDays } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    const quotation = await Quotation.create({
      leadId,
      requestedBy: req.user ? req.user._id : null,
      employeeRequestedPrice,
      marginNote,
      paymentTerms,
      validityDays: validityDays || 7,
      status: 'PENDING'
    });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'QUOTATION_REQUESTED',
      entityType: 'QUOTATION',
      entityId: quotation._id.toString(),
      metadata: { leadId }
    });

    return ok(res, { quotation }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function pendingQuotations(req, res) {
  try {
    let filter = { status: 'PENDING' };
    if (req.user.role !== 'ADMIN') {
      const myLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      filter.leadId = { $in: leadIds };
    }
    const quotations = await Quotation.find(filter).populate('leadId').sort({ createdAt: -1 });
    return ok(res, { quotations });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function approveQuotation(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: Only Admin can approve quotations');
    }
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return fail(res, 404, 'VALIDATION_FAILED', 'Quotation not found');

    quotation.status = 'APPROVED';
    quotation.approvedPrice = req.body.approvedPrice || quotation.employeeRequestedPrice;
    quotation.approvedBy = req.user ? req.user._id : null;
    quotation.approvedAt = new Date();
    await quotation.save();

    await Lead.findByIdAndUpdate(quotation.leadId, { stage: 'QUOTATION_SHARED' });

    return ok(res, { quotation });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function rejectQuotation(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: Only Admin can reject quotations');
    }
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return fail(res, 404, 'VALIDATION_FAILED', 'Quotation not found');

    quotation.status = 'REJECTED';
    quotation.marginNote = req.body.marginNote || quotation.marginNote;
    await quotation.save();

    return ok(res, { quotation });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  requestQuotation,
  pendingQuotations,
  approveQuotation,
  rejectQuotation
};