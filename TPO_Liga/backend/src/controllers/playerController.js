const PlayerModel = require('../models/Player');

exports.createPlayer = async (req, res) => {
  try {
    const { TeamID, FirstName, LastName, CategoryID, seasonId } = req.body;
    if (!FirstName || !LastName) {
      return res.status(400).json({ message: 'FirstName and LastName are required.' });
    }
    const player = await PlayerModel.create(TeamID, FirstName, LastName, CategoryID, seasonId);
    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllPlayers = async (req, res) => {
  try {
    const { seasonId } = req.query;
    const players = await PlayerModel.getAll(seasonId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { seasonId } = req.query;
    const player = await PlayerModel.getById(id, seasonId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getPlayersByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { seasonId } = req.query;
    const players = await PlayerModel.getByTeamId(teamId, seasonId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players for team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { TeamID, FirstName, LastName, CategoryID, seasonId } = req.body;
    
    if (!TeamID && !FirstName && !LastName && !CategoryID) {
      return res.status(400).json({ message: 'At least one field is required for update.' });
    }
    
    const updatedPlayer = await PlayerModel.update(id, TeamID, FirstName, LastName, CategoryID, seasonId);
    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Player not found.' });
    }
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await PlayerModel.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Player not found.' });
    }
    res.json({ message: 'Player deleted successfully.' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
