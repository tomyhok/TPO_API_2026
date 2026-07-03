const TeamModel = require('../models/Team');

exports.createTeam = async (req, res) => {
  try {
    const { Name, Coach, LogoURL, seasonId, StadiumName } = req.body;
    if (!Name || !Coach) {
      return res.status(400).json({ message: 'Name and Coach are required.' });
    }
    const team = await TeamModel.create(Name, Coach, LogoURL, seasonId, StadiumName);
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({ message: 'Ya existe un equipo registrado con ese nombre.' });
    }
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
    const { Name, Coach, LogoURL, StadiumName } = req.body;
    if (!Name && !Coach && LogoURL === undefined && StadiumName === undefined) {
      return res.status(400).json({ message: 'At least Name, Coach, LogoURL or StadiumName must be provided for update.' });
    }
    const updatedTeam = await TeamModel.update(id, Name, Coach, LogoURL, StadiumName);
    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({ message: 'Ya existe un equipo registrado con ese nombre.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await TeamModel.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Equipo no encontrado.' });
    }
    res.json({ message: 'Equipo eliminado exitosamente.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    if (error.number === 547) {
      return res.status(400).json({ message: 'No se puede eliminar este equipo porque tiene jugadores o partidos históricos asociados.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
