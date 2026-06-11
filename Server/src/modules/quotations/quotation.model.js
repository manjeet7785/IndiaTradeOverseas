
import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  requestedBy: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: String, required: true },
  destination: { type: String, required: true },
  customerExpectedPrice: { type: Number, required: true },
  employeeRequestedPrice: { type: Number, required: true },
  approvedPrice: { type: Number, default: null },
  marginNote: { type: String },
  status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'PENDING_APPROVAL' },
  approvedBy: { type: String, default: null }
}, { timestamps: true });

export const Quotation = mongoose.model('Quotation', quotationSchema);
