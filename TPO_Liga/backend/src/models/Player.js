const { sql, poolPromise } = require('../config/db');

class PlayerModel {
  static async create(TeamID, FirstName, LastName, Category) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TeamID', sql.Int, TeamID)
      .input('FirstName', sql.NVarChar, FirstName)
      .input('LastName', sql.NVarChar, LastName)
      .input('Category', sql.NVarChar, Category)
      .query('INSERT INTO Players (TeamID, FirstName, LastName, Category) OUTPUT INSERTED.* VALUES (@TeamID, @FirstName, @LastName, @Category)');
    return result.recordset[0];
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Players');
    return result.recordset;
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('SELECT * FROM Players WHERE PlayerID = @PlayerID');
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async getByTeamId(teamId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TeamID', sql.Int, teamId)
      .query('SELECT * FROM Players WHERE TeamID = @TeamID');
    return result.recordset;
  }

  static async update(id, TeamID, FirstName, LastName, Category) {
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

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('DELETE FROM Players WHERE PlayerID = @PlayerID');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = PlayerModel;
