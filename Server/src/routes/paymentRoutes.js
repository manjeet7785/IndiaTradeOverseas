const router = require('express').Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { upload } = require('../controllers/documentController');
const { createPayment, listPayments, updatePaymentStatus, listOutstandingPayments, triggerReminder } = require('../controllers/paymentController');

// All payment routes require authentication
router.use(auth);

// Create new payment (restricted to Admin, Manager, and Accounts)
router.post('/', rbac('ADMIN', 'MANAGER', 'ACCOUNTS'), createPayment);

// Get outstanding payments
router.get('/outstanding', listOutstandingPayments);

// Get all payments
router.get('/', listPayments);

// Update payment details/status or upload invoice/payment proof files
router.patch('/:id', upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'paymentProof', maxCount: 1 }
]), updatePaymentStatus);

// Trigger payment reminder to customer
router.post('/:id/reminder', triggerReminder);

module.exports = router;