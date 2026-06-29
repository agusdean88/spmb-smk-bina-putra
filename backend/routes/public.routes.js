const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

console.log('[DEBUG] publicController functions:', Object.keys(publicController));

router.get('/announcements/featured', publicController.getFeaturedAnnouncements);
router.get('/announcements/:slug', publicController.getAnnouncementBySlug);
router.get('/announcements', publicController.getAnnouncements);
router.get('/check-status/:nisn', publicController.checkStatus);
router.get('/jurusan', publicController.getJurusanList);
router.get('/schedule', publicController.getSchedule);
router.get('/brosur', publicController.getBrosur);
router.get('/brosur/download/:id', publicController.downloadBrosurById);
router.get('/proxy-pdf', publicController.proxyPdfFile);
router.get('/settings', publicController.getSettings);
router.get('/hero-image', publicController.getHeroImage);
router.get('/settings/logo', publicController.getLogoSettings);
router.get('/seleksi', publicController.getPublicRanking);

module.exports = router;
