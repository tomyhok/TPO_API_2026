const { sql, poolPromise } = require('../config/db');

exports.createTeam = async (req, res) => {
  try {
    const { Name, Coach } = req.body;
    if (!Name || !Coach) {
      return res.status(400).json({ message: 'Name and Coach are required.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Coach', sql.NVarChar, Coach)
      .query('INSERT INTO Teams (Name, Coach) OUTPUT INSERTED.* VALUES (@Name, @Coach)');

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Teams');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .query('SELECT * FROM Teams WHERE Id = @Id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
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

    const pool = await poolPromise;
    const request = pool.request().input('Id', sql.Int, id);
    
    let updates = [];
    if (Name) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (Coach) {
      request.input('Coach', sql.NVarChar, Coach);
      updates.push('Coach = @Coach');
    }
    
    const query = `UPDATE Teams SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE Id = @Id`;
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .query('DELETE FROM Teams WHERE Id = @Id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    res.json({ message: 'Team deleted successfully.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
