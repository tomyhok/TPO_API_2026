const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standingsController');

// Define GET route for Standings
router.get('/', standingsController.getStandings);

module.exports = router;
