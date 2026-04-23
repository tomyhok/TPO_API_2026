const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Define CRUD routes for Matches
router.post('/', matchController.createMatch);
router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatchDetails);
router.put('/:id/score', matchController.updateMatchScore);
router.delete('/:id', matchController.deleteMatch);

module.exports = router;
