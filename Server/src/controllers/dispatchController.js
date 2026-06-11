const Dispatch = require('../models/Dispatch');
const Lead = require('../models/Lead');
const { ok, fail } = require('../utils/response');
const { recordAudit } = require('../utils/tracking');
const { encryptText, maskPhone } = require('../utils/crypto');

async function createDispatch(req, res) {
  try {
    const { leadId, quotationId, loadingPoint, destination, truckNo, driverName, driverPhone, material, quantity, loadingDate } = req.body;
    
    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    // Access check: only Admin/Manager/Procurement can create, or assigned sales executive
    const hasAccess = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'MANAGER' || 
      req.user.role === 'PROCUREMENT' || 
      (lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString());

    if (!hasAccess) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only dispatch for leads assigned to you or your department');
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
      driverPhoneEncrypted: driverPhone ? encryptText(driverPhone) : '',
      driverPhoneMasked: driverPhone ? maskPhone(driverPhone) : '',
      dispatchStatus: 'Pending'
    });

    // Update lead stage to indicate dispatch is planned/started
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
    
    // Employees can only view dispatches linked to leads they can access
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.role !== 'PROCUREMENT') {
      const myLeads = await Lead.find({
        $or: [
          { assignedTo: req.user._id },
          { assignedDepartment: req.user.department }
        ]
      }).select('_id');
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
    
    // Access check: Admin/Manager/Procurement or the assigned sales executive
    const hasAccess = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'MANAGER' || 
      req.user.role === 'PROCUREMENT' || 
      (lead && lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString());

    if (!hasAccess) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only update status for dispatches assigned to you');
    }

    const newStatus = req.body.dispatchStatus;
    if (newStatus) {
      dispatch.dispatchStatus = newStatus;
      if (newStatus === 'Delivered') {
        dispatch.deliveryDate = new Date();
      }
    }
    
    if (req.body.loadingPoint) dispatch.loadingPoint = req.body.loadingPoint;
    if (req.body.destination) dispatch.destination = req.body.destination;
    if (req.body.truckNo) dispatch.truckNo = req.body.truckNo;
    if (req.body.driverName) dispatch.driverName = req.body.driverName;
    if (req.body.driverPhone) {
      dispatch.driverPhoneEncrypted = encryptText(req.body.driverPhone);
      dispatch.driverPhoneMasked = maskPhone(req.body.driverPhone);
    }
    
    await dispatch.save();

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'DISPATCH_STATUS_UPDATED',
      entityType: 'DISPATCH',
      entityId: dispatch._id.toString(),
      metadata: { status: newStatus }
    });

    return ok(res, { dispatch });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function uploadDispatchProof(req, res) {
  try {
    if (!req.file) return fail(res, 400, 'VALIDATION_FAILED', 'File is required');
    const dispatchId = req.params.id;
    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) return fail(res, 404, 'VALIDATION_FAILED', 'Dispatch not found');

    const lead = await Lead.findById(dispatch.leadId);
    
    // Access check
    const hasAccess = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'MANAGER' || 
      req.user.role === 'PROCUREMENT' || 
      (lead && lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString());

    if (!hasAccess) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied: You can only upload proof for dispatches assigned to you');
    }

    const Document = require('../models/Document');
    const crypto = require('crypto');
    const checksum = crypto.createHash('sha256').update(req.file.filename).digest('hex');

    const doc = await Document.create({
      ownerType: 'DISPATCH',
      ownerId: dispatch._id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      storagePath: req.file.path,
      uploadedBy: req.user ? req.user._id : null,
      accessLevel: 'RESTRICTED',
      checksum,
      virusScanStatus: 'CLEAN'
    });

    dispatch.proofDocumentId = doc._id;
    await dispatch.save();

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: doc._id.toString(),
      severity: 'LOW',
      metadata: { ownerType: 'DISPATCH', ownerId: dispatch._id.toString(), fileName: doc.fileName }
    });

    return ok(res, { dispatch, document: doc }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createDispatch,
  listDispatches,
  updateDispatchStatus,
  uploadDispatchProof
};