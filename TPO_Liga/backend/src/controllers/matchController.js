const MatchModel = require('../models/Match');

exports.createMatch = async (req, res) => {
  try {
    const { LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, seasonId } = req.body;
    if (!LocalTeamID || !VisitorTeamID || !MatchDate) {
      return res.status(400).json({ message: 'LocalTeamID, VisitorTeamID and MatchDate are required.' });
    }
    const match = await MatchModel.create(LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, seasonId);
    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllMatches = async (req, res) => {
  try {
    const { seasonId } = req.query;
    const matches = await MatchModel.getAll(seasonId);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const { seasonId } = req.query;
    const match = await MatchModel.getById(id, seasonId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { MatchDate, MatchTime, Location, LocalPoints, VisitorPoints } = req.body;
    
    let updatedMatch = null;
    if (MatchDate !== undefined || MatchTime !== undefined || Location !== undefined) {
      updatedMatch = await MatchModel.updateDetails(id, MatchDate, MatchTime, Location);
    }
    
    if (LocalPoints !== undefined && VisitorPoints !== undefined) {
      updatedMatch = await MatchModel.updateScore(id, LocalPoints, VisitorPoints);
    }
    
    if (!updatedMatch) {
      // Si todo fue null pero enviaron vacio
      updatedMatch = await MatchModel.getById(id);
      if (!updatedMatch) return res.status(404).json({ message: 'Match not found.' });
    }

    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await MatchModel.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Match not found.' });
    }
    res.json({ message: 'Match deleted successfully.' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
