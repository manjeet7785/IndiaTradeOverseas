
import { Quotation } from './quotation.model.js';
import { AuditLog } from '../security-audit/auditLog.model.js';

export const requestQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.create({ ...req.body, requestedBy: req.user.employeeId });
    await AuditLog.create({ actorId: req.user.employeeId, actionType: 'QUOTATION_REQUEST', entityType: 'QUOTATION', entityId: quotation._id, severity: 'LOW' });
    res.status(201).json({ success: true, message: 'Quotation entry buffered into administration review state model', data: quotation });
  } catch (error) {
    next(error);
  }
};

export const getPendingQuotations = async (req, res, next) => {
  try {
    const data = await Quotation.find({ status: 'PENDING_APPROVAL' }).populate('leadId');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const approveQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvedPrice, marginNote } = req.body;
    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Target specification mapping index null' });

    quotation.approvedPrice = approvedPrice;
    quotation.marginNote = marginNote;
    quotation.status = 'APPROVED';
    quotation.approvedBy = req.user.employeeId;
    await quotation.save();

    await AuditLog.create({ actorId: req.user.employeeId, actionType: 'QUOTATION_APPROVED', entityType: 'QUOTATION', entityId: quotation._id, severity: 'MEDIUM' });
    res.json({ success: true, message: 'Corporate quote authorized safely into active operation matrix', data: quotation });
  } catch (error) {
    next(error);
  }
};
