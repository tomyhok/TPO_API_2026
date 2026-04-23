const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Define CRUD routes for Players
router.post('/', playerController.createPlayer);
router.get('/', playerController.getAllPlayers);
router.get('/:id', playerController.getPlayerById);
router.get('/team/:teamId', playerController.getPlayersByTeamId);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

module.exports = router;
