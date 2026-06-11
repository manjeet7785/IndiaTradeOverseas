import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  leadCode: { type: String, required: true, unique: true },
  source: { type: String, enum: ['WEBSITE', 'AI_AGENT', 'WHATSAPP', 'INDIAMART', 'MANUAL'], required: true },
  customerName: { type: String, required: true },
  companyName: { type: String },
  phoneEncrypted: { type: String, required: true },
  phoneHash: { type: String, required: true, index: true },
  emailEncrypted: { type: String },
  emailHash: { type: String, index: true },
  productCategory: { type: String, enum: ['STONE', 'COAL', 'TEA', 'RICE', 'TRANSPORT'], required: true },
  quantity: { type: String },
  destination: { type: String },
  priority: { type: String, enum: ['HOT', 'WARM', 'COLD', 'FAKE'], default: 'WARM' },
  stage: {
    type: String,
    enum: ['NEW_LEAD', 'QUALIFICATION', 'FOLLOW_UP', 'QUOTATION_REQUIRED', 'APPROVED', 'ORDER_CONFIRMED', 'CLOSED_LOST'],
    default: 'NEW_LEAD'
  },
  assignedTo: { type: String, default: null },
  chatSummary: { type: String }
}, { timestamps: true });

export const Lead = mongoose.model('Lead', leadSchema);






