const router = require('express').Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { upload } = require('../controllers/documentController');
const { createDispatch, listDispatches, updateDispatchStatus, uploadDispatchProof } = require('../controllers/dispatchController');

// All dispatch routes require authentication
router.use(auth);

// Create new dispatch (restricted to Admin, Manager, and Procurement/Operations)
router.post('/', rbac('ADMIN', 'MANAGER', 'PROCUREMENT'), createDispatch);

// View dispatches list
router.get('/', listDispatches);

// Update status (supports both /:id/status and /:id)
router.patch('/:id/status', updateDispatchStatus);
router.patch('/:id', updateDispatchStatus);

// Upload dispatch proof document/image
router.post('/:id/proof', upload.single('file'), uploadDispatchProof);

module.exports = router;