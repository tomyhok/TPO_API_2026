const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middlewares/authMiddleware');

// Define rutas CRUD para Partidos (Matches)
router.post('/', authMiddleware, matchController.createMatch);
router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', authMiddleware, matchController.updateMatch);
router.delete('/:id', authMiddleware, matchController.deleteMatch);

module.exports = router;
