const { sql, poolPromise } = require('../config/db');

class MatchModel {
  static async create(LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, seasonId) {
    const pool = await poolPromise;
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeRes = await pool.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
      if (activeRes.recordset.length > 0) targetSeasonId = activeRes.recordset[0].SeasonID;
    }

    const result = await pool.request()
      .input('LocalTeamID', sql.Int, LocalTeamID)
      .input('VisitorTeamID', sql.Int, VisitorTeamID)
      .input('MatchDate', sql.Date, MatchDate || null)
      .input('MatchTime', sql.Time, MatchTime || null)
      .input('Location', sql.NVarChar, Location || '')
      .input('SeasonID', sql.Int, targetSeasonId)
      .query('INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, SeasonID) OUTPUT INSERTED.* VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location, @SeasonID)');
    return result.recordset[0];
  }

  static async getAll(seasonId) {
    const pool = await poolPromise;
    const request = pool.request();
    let query = 'SELECT * FROM Matches';
    
    if (seasonId) {
      request.input('SeasonID', sql.Int, seasonId);
      query = 'SELECT * FROM Matches WHERE SeasonID = @SeasonID ORDER BY MatchDate DESC';
    } else {
      query = `
        SELECT m.* FROM Matches m
        INNER JOIN Seasons s ON m.SeasonID = s.SeasonID
        WHERE s.IsActive = 1
        ORDER BY m.MatchDate DESC
      `;
    }
    const result = await request.query(query);
    return result.recordset;
  }

  static async getById(id, seasonId) {
    const pool = await poolPromise;
    const request = pool.request().input('MatchID', sql.Int, id);
    let query = 'SELECT * FROM Matches WHERE MatchID = @MatchID';
    if (seasonId) {
       request.input('SeasonID', sql.Int, seasonId);
       query += ' AND SeasonID = @SeasonID';
    }
    const result = await request.query(query);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async updateDetails(id, MatchDate, MatchTime, Location) {
    const pool = await poolPromise;
    const request = pool.request().input('MatchID', sql.Int, id);
    
    let updates = [];
    if (MatchDate !== undefined) {
      request.input('MatchDate', sql.Date, MatchDate || null);
      updates.push('MatchDate = @MatchDate');
    }
    if (MatchTime !== undefined) {
      request.input('MatchTime', sql.Time, MatchTime || null);
      updates.push('MatchTime = @MatchTime');
    }
    if (Location !== undefined) {
      request.input('Location', sql.NVarChar, Location || '');
      updates.push('Location = @Location');
    }
    if (updates.length === 0) return null;
    
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
