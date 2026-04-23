const { sql, poolPromise } = require('../config/db');

exports.createMatch = async (req, res) => {
  try {
    const { LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location } = req.body;
    
    if (!LocalTeamID || !VisitorTeamID || !MatchDate || !MatchTime || !Location) {
      return res.status(400).json({ message: 'LocalTeamID, VisitorTeamID, MatchDate, MatchTime, and Location are required.' });
    }

    if (LocalTeamID === VisitorTeamID) {
      return res.status(400).json({ message: 'LocalTeamID and VisitorTeamID cannot be the same.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('LocalTeamID', sql.Int, LocalTeamID)
      .input('VisitorTeamID', sql.Int, VisitorTeamID)
      .input('MatchDate', sql.Date, MatchDate)
      .input('MatchTime', sql.Time, MatchTime)
      .input('Location', sql.NVarChar, Location)
      .query('INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location) OUTPUT INSERTED.* VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location)');

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllMatches = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Matches');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('MatchID', sql.Int, id)
      .query('SELECT * FROM Matches WHERE MatchID = @MatchID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateMatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { MatchDate, MatchTime, Location } = req.body;
    
    if (!MatchDate && !MatchTime && !Location) {
      return res.status(400).json({ message: 'At least one field (MatchDate, MatchTime, or Location) must be provided for update.' });
    }

    const pool = await poolPromise;
    const request = pool.request().input('MatchID', sql.Int, id);
    
    let updates = [];
    if (MatchDate) {
      request.input('MatchDate', sql.Date, MatchDate);
      updates.push('MatchDate = @MatchDate');
    }
    if (MatchTime) {
      request.input('MatchTime', sql.Time, MatchTime);
      updates.push('MatchTime = @MatchTime');
    }
    if (Location) {
      request.input('Location', sql.NVarChar, Location);
      updates.push('Location = @Location');
    }
    
    const query = `UPDATE Matches SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE MatchID = @MatchID`;
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating match details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateMatchScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { LocalPoints, VisitorPoints } = req.body;
    
    if (LocalPoints === undefined || VisitorPoints === undefined) {
      return res.status(400).json({ message: 'Both LocalPoints and VisitorPoints must be provided.' });
    }

    const pool = await poolPromise;
    const request = pool.request()
      .input('MatchID', sql.Int, id)
      .input('LocalPoints', sql.Int, LocalPoints)
      .input('VisitorPoints', sql.Int, VisitorPoints);
      
    const query = `UPDATE Matches SET LocalPoints = @LocalPoints, VisitorPoints = @VisitorPoints OUTPUT INSERTED.* WHERE MatchID = @MatchID`;
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating match score:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('MatchID', sql.Int, id)
      .query('DELETE FROM Matches WHERE MatchID = @MatchID');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    res.json({ message: 'Match deleted successfully.' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
