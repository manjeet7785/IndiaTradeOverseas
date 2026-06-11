const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Document = require('../models/Document');
const { ok, fail } = require('../utils/response');
const { recordAudit } = require('../utils/tracking');

const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({ storage });

async function uploadDocument(req, res) {
  try {
    if (!req.file) return fail(res, 400, 'VALIDATION_FAILED', 'File is required');
    const { ownerType, ownerId, accessLevel = 'RESTRICTED' } = req.body;
    if (!ownerType || !ownerId) return fail(res, 400, 'VALIDATION_FAILED', 'ownerType and ownerId are required');

    const checksum = crypto.createHash('sha256').update(req.file.filename).digest('hex');
    const doc = await Document.create({
      ownerType,
      ownerId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      storagePath: req.file.path,
      uploadedBy: req.user ? req.user._id : null,
      accessLevel,
      checksum,
      virusScanStatus: 'CLEAN'
    });

    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: doc._id.toString(),
      severity: 'LOW',
      metadata: { ownerType, ownerId, fileName: doc.fileName }
    });

    return ok(res, { document: doc }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function getDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return fail(res, 404, 'VALIDATION_FAILED', 'Document not found');
    return ok(res, { document: doc });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function downloadDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return fail(res, 404, 'VALIDATION_FAILED', 'Document not found');
    if (!fs.existsSync(doc.storagePath)) return fail(res, 404, 'VALIDATION_FAILED', 'File missing on disk');
    return res.download(doc.storagePath, doc.fileName);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function updateAccessLevel(req, res) {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, { accessLevel: req.body.accessLevel }, { new: true });
    if (!doc) return fail(res, 404, 'VALIDATION_FAILED', 'Document not found');
    return ok(res, { document: doc });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function softDeleteDocument(req, res) {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!doc) return fail(res, 404, 'VALIDATION_FAILED', 'Document not found');
    await recordAudit({
      actorId: req.user ? req.user._id : null,
      actionType: 'DOCUMENT_SOFT_DELETED',
      entityType: 'DOCUMENT',
      entityId: doc._id.toString(),
      severity: 'MEDIUM'
    });
    return ok(res, { document: doc });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listDocuments(req, res) {
  try {
    const Lead = require('../models/Lead');
    let filter = { isDeleted: false };
    if (req.user.role !== 'ADMIN') {
      const myLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const myLeadIds = myLeads.map(l => l._id);

      filter.$or = [
        { uploadedBy: req.user._id },
        { ownerType: 'LEAD', ownerId: { $in: myLeadIds } }
      ];
    }
    const documents = await Document.find(filter).sort({ createdAt: -1 });
    return ok(res, { documents });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  upload,
  uploadDocument,
  getDocument,
  downloadDocument,
  updateAccessLevel,
  softDeleteDocument,
  listDocuments
};





