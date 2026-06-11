const router = require('express').Router();
const auth = require('../middleware/auth');
const { upload, uploadDocument, getDocument, downloadDocument, updateAccessLevel, softDeleteDocument, listDocuments } = require('../controllers/documentController');

router.use(auth);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', getDocument);
router.get('/:id/download', downloadDocument);
router.patch('/:id/access-level', updateAccessLevel);
router.delete('/:id', softDeleteDocument);

module.exports = router;
