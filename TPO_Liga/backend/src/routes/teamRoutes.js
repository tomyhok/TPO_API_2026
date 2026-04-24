const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');

// Define rutas CRUD para Equipos (Teams)
router.post('/', authMiddleware, teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.put('/:id', authMiddleware, teamController.updateTeam);
router.delete('/:id', authMiddleware, teamController.deleteTeam);

module.exports = router;
