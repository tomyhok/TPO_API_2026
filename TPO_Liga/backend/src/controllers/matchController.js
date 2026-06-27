const MatchModel = require('../models/Match');

exports.createMatch = async (req, res) => {
  try {
    const { LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, CategoryID, seasonId, RoundNumber } = req.body;
    if (!LocalTeamID || !VisitorTeamID || !MatchDate) {
      return res.status(400).json({ message: 'LocalTeamID, VisitorTeamID and MatchDate are required.' });
    }
    
    if (String(LocalTeamID) === String(VisitorTeamID)) {
      return res.status(400).json({ message: 'El equipo local y el equipo visitante no pueden ser el mismo.' });
    }

    if (RoundNumber) {
      const availability = await MatchModel.checkTeamAvailability(LocalTeamID, VisitorTeamID, RoundNumber, CategoryID, seasonId);
      if (!availability.available) {
        return res.status(400).json({ message: `Uno de los equipos seleccionados ya tiene un partido en la Jornada ${RoundNumber}.` });
      }
    }

    let matchTimeObj = new Date();
    if (MatchTime) {
      const [hours, minutes] = MatchTime.split(':');
      matchTimeObj.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      matchTimeObj.setUTCHours(20, 0, 0, 0); // Default 20:00 if not provided
    }

    const match = await MatchModel.create(LocalTeamID, VisitorTeamID, MatchDate, matchTimeObj, Location, CategoryID, seasonId, RoundNumber);
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
    const { MatchDate, MatchTime, Location, CategoryID, LocalPoints, VisitorPoints, RoundNumber, LocalTeamID, VisitorTeamID } = req.body;

    const existingMatch = await MatchModel.getById(id);
    if (!existingMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    if (LocalTeamID !== undefined && VisitorTeamID !== undefined && String(LocalTeamID) === String(VisitorTeamID)) {
      return res.status(400).json({ message: 'El equipo local y el equipo visitante no pueden ser el mismo.' });
    }

    const localTeam = LocalTeamID !== undefined ? LocalTeamID : existingMatch.LocalTeamID;
    const visitorTeam = VisitorTeamID !== undefined ? VisitorTeamID : existingMatch.VisitorTeamID;
    const catId = CategoryID !== undefined ? CategoryID : existingMatch.CategoryID;
    const round = RoundNumber !== undefined ? RoundNumber : existingMatch.RoundNumber;
    const sId = existingMatch.SeasonID;

    if (round) {
      const availability = await MatchModel.checkTeamAvailability(localTeam, visitorTeam, round, catId, sId, id);
      if (!availability.available) {
        return res.status(400).json({ message: `Uno de los equipos seleccionados ya tiene un partido en la Jornada ${round}.` });
      }
    }
    
    let matchTimeObj = undefined;
    if (MatchTime !== undefined) {
      if (MatchTime) {
        // If it comes as a time string like HH:mm
        const [hours, minutes] = String(MatchTime).split(':');
        matchTimeObj = new Date();
        matchTimeObj.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      } else {
        matchTimeObj = new Date();
        matchTimeObj.setUTCHours(20, 0, 0, 0);
      }
    }

    // 1. Update basic details
    await MatchModel.updateDetails(id, MatchDate, matchTimeObj, Location, CategoryID, RoundNumber, LocalTeamID, VisitorTeamID);
    
    // 2. Update scores if they exist (even if they are null for clearing)
    if (LocalPoints !== undefined && VisitorPoints !== undefined) {
      await MatchModel.updateScore(id, LocalPoints, VisitorPoints);
    }

    const updatedMatch = await MatchModel.getById(id);
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateMatchScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { LocalPoints, VisitorPoints } = req.body;
    if (LocalPoints === undefined || VisitorPoints === undefined) {
      return res.status(400).json({ message: 'Both points are required.' });
    }
    const updatedMatch = await MatchModel.updateScore(id, LocalPoints, VisitorPoints);
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match score:', error);
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
