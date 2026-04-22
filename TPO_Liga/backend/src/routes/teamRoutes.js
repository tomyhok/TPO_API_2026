const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Define CRUD routes for Teams
router.post('/', teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
