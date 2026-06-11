
import { Router } from 'express';
import { requestQuotation, getPendingQuotations, approveQuotation } from './quotation.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.post('/request', protect, authorizeRoles('SALES', 'ADMIN'), requestQuotation);
router.get('/pending', protect, authorizeRoles('ADMIN'), getPendingQuotations);
router.patch('/:id/approve', protect, authorizeRoles('ADMIN'), approveQuotation);

export default router;








