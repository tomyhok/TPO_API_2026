const { sql, poolPromise } = require('../config/db');

class MatchModel {
  static async create(LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('LocalTeamID', sql.Int, LocalTeamID)
      .input('VisitorTeamID', sql.Int, VisitorTeamID)
      .input('MatchDate', sql.Date, MatchDate)
      .input('MatchTime', sql.Time, MatchTime)
      .input('Location', sql.NVarChar, Location)
      .query('INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location) OUTPUT INSERTED.* VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location)');
    return result.recordset[0];
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Matches');
    return result.recordset;
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('MatchID', sql.Int, id)
      .query('SELECT * FROM Matches WHERE MatchID = @MatchID');
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async updateDetails(id, MatchDate, MatchTime, Location) {
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

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async updateScore(id, LocalPoints, VisitorPoints) {
    const pool = await poolPromise;
    const request = pool.request()
      .input('MatchID', sql.Int, id)
      .input('LocalPoints', sql.Int, LocalPoints)
      .input('VisitorPoints', sql.Int, VisitorPoints);
      
    const query = `UPDATE Matches SET LocalPoints = @LocalPoints, VisitorPoints = @VisitorPoints OUTPUT INSERTED.* WHERE MatchID = @MatchID`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('MatchID', sql.Int, id)
      .query('DELETE FROM Matches WHERE MatchID = @MatchID');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = MatchModel;
