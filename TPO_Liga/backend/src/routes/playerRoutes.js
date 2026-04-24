const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Define rutas CRUD para Jugadores (Players)
router.post('/', authMiddleware, playerController.createPlayer);
router.get('/', playerController.getAllPlayers);
router.get('/:id', playerController.getPlayerById);
router.get('/team/:teamId', playerController.getPlayersByTeamId);
router.put('/:id', authMiddleware, playerController.updatePlayer);
router.delete('/:id', authMiddleware, playerController.deletePlayer);

module.exports = router;
