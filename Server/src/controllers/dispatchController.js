const Dispatch = require('../models/Dispatch');
const Lead = require('../models/Lead');
const { ok, fail } = require('../utils/response');
const { recordAudit } = require('../utils/tracking');

async function createDispatch(req, res) {
  try {
    const { leadId, quotationId, loadingPoint, destination, truckNo, driverName, driverPhone, material, quantity, loadingDate } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    if (req.user.role !== 'ADMIN' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only dispatch for leads assigned to you');
    }

    const dispatch = await Dispatch.create({
      leadId,
      quotationId,
      loadingPoint,
      destination,
      truckNo,
      driverName,
      material,
      quantity,
      loadingDate,
      driverPhoneEncrypted: driverPhone || '',
      driverPhoneMasked: driverPhone ? `${String(driverPhone).slice(0, 2)}xxxx${String(driverPhone).slice(-2)}` : ''
    });

    await Lead.findByIdAndUpdate(leadId, { stage: 'DISPATCH_PLANNED' });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'DISPATCH_CREATED',
      entityType: 'DISPATCH',
      entityId: dispatch._id.toString(),
      metadata: { leadId }
    });

    return ok(res, { dispatch }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listDispatches(req, res) {
  try {
    let filter = {};
    if (req.user.role !== 'ADMIN') {
      const myLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      filter.leadId = { $in: leadIds };
    }
    const dispatches = await Dispatch.find(filter).populate('leadId').sort({ createdAt: -1 });
    return ok(res, { dispatches });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function updateDispatchStatus(req, res) {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) return fail(res, 404, 'VALIDATION_FAILED', 'Dispatch not found');

    const lead = await Lead.findById(dispatch.leadId);
    if (lead && req.user.role !== 'ADMIN' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only update dispatches for leads assigned to you');
    }

    dispatch.dispatchStatus = req.body.dispatchStatus;
    if (req.body.dispatchStatus === 'DELIVERED') {
      dispatch.deliveryDate = new Date();
    }
    await dispatch.save();

    return ok(res, { dispatch });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createDispatch,
  listDispatches,
  updateDispatchStatus
};