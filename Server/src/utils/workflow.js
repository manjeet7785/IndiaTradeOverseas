const LEAD_STAGES = {
  NEW_LEAD: 'NEW_LEAD',
  ASSIGNED: 'ASSIGNED',
  CONTACTED: 'CONTACTED',
  QUOTATION_REQUIRED: 'QUOTATION_REQUIRED',
  QUOTATION_REQUESTED: 'QUOTATION_REQUESTED',
  QUOTATION_SHARED: 'QUOTATION_SHARED',
  DISPATCH_PLANNED: 'DISPATCH_PLANNED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  DOCUMENT_PENDING: 'DOCUMENT_PENDING',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
};

const allowedStageTransitions = {
  [LEAD_STAGES.NEW_LEAD]: [LEAD_STAGES.ASSIGNED, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.ASSIGNED]: [LEAD_STAGES.CONTACTED, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.CONTACTED]: [LEAD_STAGES.QUOTATION_REQUIRED, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.QUOTATION_REQUIRED]: [LEAD_STAGES.QUOTATION_REQUESTED, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.QUOTATION_REQUESTED]: [LEAD_STAGES.QUOTATION_SHARED, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.QUOTATION_SHARED]: [LEAD_STAGES.DISPATCH_PLANNED, LEAD_STAGES.CLOSED_WON, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.DISPATCH_PLANNED]: [LEAD_STAGES.PAYMENT_PENDING, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.PAYMENT_PENDING]: [LEAD_STAGES.DOCUMENT_PENDING, LEAD_STAGES.CLOSED_WON, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.DOCUMENT_PENDING]: [LEAD_STAGES.CLOSED_WON, LEAD_STAGES.CLOSED_LOST],
  [LEAD_STAGES.CLOSED_WON]: [],
  [LEAD_STAGES.CLOSED_LOST]: []
};

function generateLeadCode() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `LD-${timestamp}-${random}`;
}

function canAccessLead(user, lead) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (lead.assignedTo && lead.assignedTo.toString() === user._id.toString()) return true;
  return false;
}

function getLeadDisplay(lead) {
  const leadObj = lead.toObject ? lead.toObject() : lead;
  return {
    ...leadObj,
    phone: leadObj.phoneMasked,
    email: leadObj.emailMasked
  };
}

function stageNeedsQuotation(stage) {
  return stage === LEAD_STAGES.QUOTATION_REQUIRED || stage === LEAD_STAGES.QUOTATION_REQUESTED;
}

module.exports = {
  LEAD_STAGES,
  allowedStageTransitions,
  generateLeadCode,
  canAccessLead,
  getLeadDisplay,
  stageNeedsQuotation
};