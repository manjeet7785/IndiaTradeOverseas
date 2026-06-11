const crypto = require('crypto');
const Lead = require('../models/Lead');
const LeadActivity = require('../models/LeadActivity');
const Quotation = require('../models/Quotation');
const AuditLog = require('../models/AuditLog');
const { encryptText, hashText, maskPhone, maskEmail } = require('../utils/crypto');
const { ok, fail } = require('../utils/response');
const { allowedStageTransitions, generateLeadCode, canAccessLead, getLeadDisplay, stageNeedsQuotation } = require('../utils/workflow');
const { recordAudit } = require('../utils/tracking');

function normalizeLeadInput(body) {
  const phone = body.mobile || body.phone || body.whatsapp || '';
  const email = body.email || '';
  const customerName = body.contactPerson || body.customerName || body.fullName || '';

  return {
    source: body.source || 'AI_AGENT',
    customerName,
    companyName: body.companyName || '',
    phone,
    email,
    productCategory: body.productCategory || body.productRequired || '',
    quantity: String(body.quantity || ''),
    destination: body.destination || '',
    priority: body.priority || 'WARM',
    stage: body.stage || 'NEW_LEAD',
    assignedDepartment: body.assignedDepartment || null,
    chatSummary: body.chatSummary || body.conversationSummary || '',
    nextFollowupAt: body.nextFollowupAt || null,
    remarks: body.remarks || '',
    conversationId: body.conversationId || ''
  };
}

async function createFromChat(req, res) {
  try {
    const input = normalizeLeadInput(req.body || {});
    if (!input.customerName || !input.phone || !input.productCategory) {
      return fail(res, 400, 'VALIDATION_FAILED', 'customerName, phone, and productCategory are required');
    }

    const phoneHash = hashText(input.phone);
    const emailHash = input.email ? hashText(input.email) : '';
    const duplicateQuery = [{ phoneHash }];
    if (emailHash) {
      duplicateQuery.push({ emailHash });
    }
    const duplicate = await Lead.findOne({ $or: duplicateQuery });

    const lead = await Lead.create({
      leadCode: generateLeadCode(),
      source: input.source,
      customerName: input.customerName,
      companyName: input.companyName,
      phoneEncrypted: encryptText(input.phone),
      phoneMasked: maskPhone(input.phone),
      phoneHash,
      emailEncrypted: input.email ? encryptText(input.email) : '',
      emailMasked: input.email ? maskEmail(input.email) : '',
      emailHash,
      productCategory: input.productCategory,
      quantity: input.quantity,
      destination: input.destination,
      priority: input.priority,
      stage: input.stage,
      assignedDepartment: input.assignedDepartment,
      duplicateOf: duplicate ? duplicate._id : null,
      chatSummary: input.chatSummary,
      nextFollowupAt: input.nextFollowupAt,
      remarks: input.remarks,
      createdBy: req.user ? req.user._id : null
    });

    await LeadActivity.create({
      leadId: lead._id,
      actionType: 'LEAD_CREATED',
      note: 'Lead created from chat payload',
      actorId: req.user ? req.user._id : null,
      metadata: { conversationId: input.conversationId, duplicateOf: duplicate ? duplicate._id : null }
    });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      severity: duplicate ? 'MEDIUM' : 'LOW',
      metadata: { source: input.source, duplicateOf: duplicate ? duplicate._id : null }
    });

    return ok(res, {
      lead: getLeadDisplay(lead),
      duplicateDetected: Boolean(duplicate),
      duplicateOf: duplicate ? duplicate._id : null
    }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listLeads(req, res) {
  try {
    const filter = {};
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.user.role !== 'ADMIN') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedDepartment: req.user.department }
      ];
    } else if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(200);
    return ok(res, { leads: leads.map((lead) => getLeadDisplay(lead)) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function getLeadById(req, res) {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');
    if (!canAccessLead(req.user, lead)) return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied');
    const activities = await LeadActivity.find({ leadId: lead._id }).sort({ createdAt: -1 }).limit(100);
    return ok(res, { lead: getLeadDisplay(lead), activities });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function addActivity(req, res) {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');
    if (!canAccessLead(req.user, lead)) return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied');

    const activity = await LeadActivity.create({
      leadId: lead._id,
      actionType: req.body.actionType || 'FOLLOW_UP',
      note: req.body.note || '',
      nextFollowupAt: req.body.nextFollowupAt || null,
      actorId: req.user._id,
      metadata: req.body.metadata || {}
    });

    if (req.body.nextFollowupAt) {
      lead.nextFollowupAt = req.body.nextFollowupAt;
      await lead.save();
    }

    await recordAudit({
      actorId: req.user._id,
      actionType: 'LEAD_ACTIVITY_ADDED',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      metadata: { activityId: activity._id }
    });

    return ok(res, { activity }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function updateStage(req, res) {
  try {
    const { newStage, remark, nextFollowupAt } = req.body;
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');
    if (!canAccessLead(req.user, lead)) return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'Access denied');

    const previousStage = lead.stage;
    if (!newStage || !allowedStageTransitions[lead.stage]?.includes(newStage)) {
      return fail(res, 400, 'VALIDATION_FAILED', `Invalid stage transition from ${lead.stage} to ${newStage}`);
    }

    lead.stage = newStage;
    if (remark) lead.remarks = remark;
    if (nextFollowupAt) lead.nextFollowupAt = nextFollowupAt;
    await lead.save();

    const activity = await LeadActivity.create({
      leadId: lead._id,
      actionType: 'LEAD_STAGE_CHANGED',
      note: remark || `Stage changed to ${newStage}`,
      nextFollowupAt: nextFollowupAt || null,
      actorId: req.user._id,
      metadata: { fromStage: previousStage, toStage: newStage }
    });

    if (stageNeedsQuotation(newStage)) {
      const existingQuotation = await Quotation.findOne({ leadId: lead._id, status: 'PENDING' });
      if (!existingQuotation) {
        await Quotation.create({ leadId: lead._id, requestedBy: req.user._id, status: 'PENDING', paymentTerms: 'As per approval' });
      }
    }

    await recordAudit({
      actorId: req.user._id,
      actionType: 'LEAD_STAGE_CHANGED',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      severity: 'LOW',
      metadata: { toStage: newStage, activityId: activity._id }
    });

    return ok(res, { lead: getLeadDisplay(lead), activity });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function assignLead(req, res) {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');

    if (req.body.hasOwnProperty('assignedTo')) {
      lead.assignedTo = req.body.assignedTo || null;
    }
    if (req.body.hasOwnProperty('assignedDepartment')) {
      lead.assignedDepartment = req.body.assignedDepartment || null;
    }
    await lead.save();

    await LeadActivity.create({
      leadId: lead._id,
      actionType: 'LEAD_ASSIGNED',
      note: `Assigned to ${req.body.assignedTo || 'same user'}`,
      actorId: req.user ? req.user._id : null,
      metadata: req.body
    });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'LEAD_ASSIGNED',
      entityType: 'LEAD',
      entityId: lead._id.toString(),
      metadata: req.body
    });

    return ok(res, { lead: getLeadDisplay(lead) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function scoreLead(req, res) {
  try {
    const { leadId, quantity, hasLOI, paymentTerms } = req.body;
    
    let qty = 0;
    let loi = false;
    let pt = '';
    
    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (!lead) return fail(res, 404, 'VALIDATION_FAILED', 'Lead not found');
      qty = parseFloat(lead.quantity) || 0;
      loi = lead.remarks?.toLowerCase().includes('loi') || lead.chatSummary?.toLowerCase().includes('loi') || false;
      pt = lead.remarks || '';
    } else {
      qty = parseFloat(quantity) || 0;
      loi = Boolean(hasLOI);
      pt = paymentTerms || '';
    }

    let score = 0;
    let priority = 'COLD';

    if (qty > 1000) score += 40;
    else if (qty > 100) score += 20;

    if (loi) score += 40;

    if (pt.toLowerCase().includes('advance') || pt.toLowerCase().includes('+')) score += 20;

    if (score >= 80) priority = 'HOT';
    else if (score >= 40) priority = 'WARM';

    return ok(res, { score, priority, criteria: { qty, loi, pt } });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listUnassignedLeads(req, res) {
  try {
    const leads = await Lead.find({ assignedTo: null }).sort({ createdAt: -1 });
    return ok(res, { leads: leads.map(l => getLeadDisplay(l)) });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createFromChat,
  listLeads,
  getLeadById,
  addActivity,
  updateStage,
  assignLead,
  scoreLead,
  listUnassignedLeads
};


