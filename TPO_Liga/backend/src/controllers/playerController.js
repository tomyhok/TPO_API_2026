const { sql, poolPromise } = require('../config/db');

exports.createPlayer = async (req, res) => {
  try {
    const { TeamID, FirstName, LastName, Category } = req.body;
    
    if (!TeamID || !FirstName || !LastName || !Category) {
      return res.status(400).json({ message: 'TeamID, FirstName, LastName, and Category are required.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('TeamID', sql.Int, TeamID)
      .input('FirstName', sql.NVarChar, FirstName)
      .input('LastName', sql.NVarChar, LastName)
      .input('Category', sql.NVarChar, Category)
      .query('INSERT INTO Players (TeamID, FirstName, LastName, Category) OUTPUT INSERTED.* VALUES (@TeamID, @FirstName, @LastName, @Category)');

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllPlayers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Players');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('SELECT * FROM Players WHERE PlayerID = @PlayerID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getPlayersByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TeamID', sql.Int, teamId)
      .query('SELECT * FROM Players WHERE TeamID = @TeamID');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching players by team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { TeamID, FirstName, LastName, Category } = req.body;
    
    if (!TeamID && !FirstName && !LastName && !Category) {
      return res.status(400).json({ message: 'At least one field must be provided for update.' });
    }

    const pool = await poolPromise;
    const request = pool.request().input('PlayerID', sql.Int, id);
    
    let updates = [];
    if (TeamID) {
      request.input('TeamID', sql.Int, TeamID);
      updates.push('TeamID = @TeamID');
    }
    if (FirstName) {
      request.input('FirstName', sql.NVarChar, FirstName);
      updates.push('FirstName = @FirstName');
    }
    if (LastName) {
      request.input('LastName', sql.NVarChar, LastName);
      updates.push('LastName = @LastName');
    }
    if (Category) {
      request.input('Category', sql.NVarChar, Category);
      updates.push('Category = @Category');
    }
    
    const query = `UPDATE Players SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE PlayerID = @PlayerID`;
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('DELETE FROM Players WHERE PlayerID = @PlayerID');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    res.json({ message: 'Player deleted successfully.' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
