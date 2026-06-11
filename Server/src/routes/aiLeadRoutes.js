const router = require('express').Router();
const auth = require('../middleware/auth');
const { createFromChat } = require('../controllers/leadController');

router.use(auth);
router.post('/from-chat', createFromChat);

module.exports = router;
