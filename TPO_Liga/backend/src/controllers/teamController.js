const TeamModel = require('../models/Team');

exports.createTeam = async (req, res) => {
  try {
    const { Name, Coach, seasonId } = req.body;
    if (!Name || !Coach) {
      return res.status(400).json({ message: 'Name and Coach are required.' });
    }
    const team = await TeamModel.create(Name, Coach, seasonId);
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const { seasonId } = req.query;
    const teams = await TeamModel.getAll(seasonId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const { seasonId } = req.query;
    const team = await TeamModel.getById(id, seasonId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    res.json(team);
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Coach } = req.body;
    if (!Name && !Coach) {
      return res.status(400).json({ message: 'At least Name or Coach must be provided for update.' });
    }
    const updatedTeam = await TeamModel.update(id, Name, Coach);
    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await TeamModel.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    res.json({ message: 'Team deleted successfully.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    if (error.number === 547) {
      return res.status(400).json({ message: 'Cannot delete team because it has associated players or matches.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};
