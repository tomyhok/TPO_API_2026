const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standingsController');

// Define ruta GET para Posiciones (Standings)
router.get('/', standingsController.getStandings);

module.exports = router;
