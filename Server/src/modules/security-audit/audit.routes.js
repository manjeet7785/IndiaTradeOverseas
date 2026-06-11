import { Router } from 'express';
import { getLogsAndAlerts, revealSensitiveData, interceptBulkExportAttempt } from './audit.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.get('/dashboard', protect, authorizeRoles('ADMIN'), getLogsAndAlerts);
router.post('/reveal', protect, revealSensitiveData);
router.post('/export-attempt', protect, interceptBulkExportAttempt);

export default router;





