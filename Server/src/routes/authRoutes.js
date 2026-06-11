const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, verifyOtp, requestOtp, getSessions, requestDeviceApproval, me } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

router.get('/sessions', auth, getSessions);
router.post('/device/request-approval', auth, requestDeviceApproval);
router.get('/me', auth, me);

module.exports = router;




