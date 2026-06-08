const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const { upload, brochureUpload, heroUpload, logoUpload, announcementUpload } = require('../middleware/upload.middleware');

router.use(verifyToken, isAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id/status', adminController.updateStatus);
router.put('/documents/:id/status', adminController.updateDocumentStatus);
router.get('/export', adminController.exportData);
router.get('/export-csv', adminController.exportCSV);
router.post('/import', upload.single('file'), adminController.importData);
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', announcementUpload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'attachment_file', maxCount: 1 }]), adminController.createAnnouncement);
router.put('/announcements/:id', announcementUpload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'attachment_file', maxCount: 1 }]), adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);
router.get('/jurusan', adminController.getJurusan);
router.put('/jurusan/:id/quota', adminController.updateJurusanQuota);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.post('/settings/brochure', brochureUpload.single('brochure'), adminController.uploadBrochure);
router.post('/settings/hero', heroUpload.single('hero'), adminController.uploadHeroImage);
router.post('/settings/logo', logoUpload.single('logo'), adminController.uploadLogo);
router.get('/brosur', adminController.getBrochures);
router.post('/brosur', brochureUpload.single('brochure'), adminController.uploadBrochure);
router.patch('/brosur/:id/status', adminController.toggleBrochureStatus);
router.delete('/brosur/:id', adminController.deleteBrochure);

router.get('/users', adminController.getUsers);
router.post('/users/admin', adminController.createAdmin);
router.put('/users/:id/password', adminController.updatePassword);
router.delete('/users/:id', adminController.deleteUser);

router.get('/seleksi', adminController.getRanking);
router.get('/seleksi/export-pdf', adminController.exportRankingPDF);
router.post('/seleksi', adminController.processSeleksi);

router.get('/laporan', adminController.getLaporanSummary);
router.get('/laporan/export-pdf', adminController.exportLaporanPDF);

module.exports = router;
