const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verifyToken, isStudent } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(verifyToken, isStudent);

router.get('/profile', studentController.getProfile);
router.put('/biodata', studentController.updateBiodata);
router.post('/documents', upload.single('file'), studentController.uploadDocument);
router.get('/download-proof', studentController.downloadProof);
router.post('/lapor-diri', studentController.laporDiri);

module.exports = router;
