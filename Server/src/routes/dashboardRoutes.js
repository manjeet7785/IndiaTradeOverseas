const router = require('express').Router();
const auth = require('../middleware/auth');
const { userDashboardSummary, userHistory, getNotifications, markNotificationRead } = require('../controllers/dashboard');

router.use(auth);
router.get('/summary', userDashboardSummary);
router.get('/history', userHistory);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

module.exports = router;
