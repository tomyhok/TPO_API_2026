const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', seasonController.getAllSeasons);
router.get('/active', seasonController.getActiveSeason);

// Admin only routes
router.post('/', authMiddleware, seasonController.createSeason);
router.put('/:id', authMiddleware, seasonController.updateSeason);
router.delete('/:id', authMiddleware, seasonController.deleteSeason);

module.exports = router;
