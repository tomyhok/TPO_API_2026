const { sql, poolPromise } = require('../config/db');

class MatchModel {
  static async create(LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, CategoryID, seasonId, RoundNumber) {
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
      .input('CategoryID', sql.Int, CategoryID)
      .input('RoundNumber', sql.Int, RoundNumber || null)
      .query('INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, SeasonID, CategoryID, RoundNumber) OUTPUT INSERTED.* VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location, @SeasonID, @CategoryID, @RoundNumber)');
    return result.recordset[0];
  }

  static async checkTeamAvailability(LocalTeamID, VisitorTeamID, RoundNumber, CategoryID, seasonId, excludeMatchId = null) {
    if (!RoundNumber) return { available: true };
    const pool = await poolPromise;
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeRes = await pool.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
      if (activeRes.recordset.length > 0) targetSeasonId = activeRes.recordset[0].SeasonID;
    }

    const request = pool.request()
      .input('LocalTeamID', sql.Int, LocalTeamID)
      .input('VisitorTeamID', sql.Int, VisitorTeamID)
      .input('RoundNumber', sql.Int, RoundNumber)
      .input('CategoryID', sql.Int, CategoryID)
      .input('SeasonID', sql.Int, targetSeasonId);

    let query = `
      SELECT MatchID, LocalTeamID, VisitorTeamID 
      FROM Matches 
      WHERE RoundNumber = @RoundNumber 
      AND CategoryID = @CategoryID 
      AND SeasonID = @SeasonID
      AND (LocalTeamID = @LocalTeamID OR VisitorTeamID = @LocalTeamID OR LocalTeamID = @VisitorTeamID OR VisitorTeamID = @VisitorTeamID)
    `;

    if (excludeMatchId) {
      request.input('ExcludeMatchID', sql.Int, excludeMatchId);
      query += ' AND MatchID != @ExcludeMatchID';
    }

    const result = await request.query(query);
    if (result.recordset.length > 0) {
      const conflict = result.recordset[0];
      if (conflict.LocalTeamID == LocalTeamID || conflict.VisitorTeamID == LocalTeamID) {
        return { available: false, teamId: LocalTeamID };
      }
      return { available: false, teamId: VisitorTeamID };
    }
    return { available: true };
  }

  static async getAll(seasonId) {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT m.*, c.Name AS CategoryName 
      FROM Matches m 
      INNER JOIN Categories c ON m.CategoryID = c.CategoryID
    `;
    
    if (seasonId) {
      request.input('SeasonID', sql.Int, seasonId);
      query += ' WHERE m.SeasonID = @SeasonID ORDER BY m.MatchDate DESC';
    } else {
      query = `
        SELECT m.*, c.Name AS CategoryName FROM Matches m
        INNER JOIN Categories c ON m.CategoryID = c.CategoryID
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
    let query = `
      SELECT m.*, c.Name AS CategoryName 
      FROM Matches m 
      INNER JOIN Categories c ON m.CategoryID = c.CategoryID 
      WHERE m.MatchID = @MatchID
    `;
    if (seasonId) {
       request.input('SeasonID', sql.Int, seasonId);
       query += ' AND m.SeasonID = @SeasonID';
    }
    const result = await request.query(query);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async updateDetails(id, MatchDate, MatchTime, Location, CategoryID, RoundNumber, LocalTeamID, VisitorTeamID) {
    const pool = await poolPromise;
    const request = pool.request().input('MatchID', sql.Int, id);
    
    let updates = [];
    if (LocalTeamID !== undefined) {
      request.input('LocalTeamID', sql.Int, LocalTeamID);
      updates.push('LocalTeamID = @LocalTeamID');
    }
    if (VisitorTeamID !== undefined) {
      request.input('VisitorTeamID', sql.Int, VisitorTeamID);
      updates.push('VisitorTeamID = @VisitorTeamID');
    }
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
    if (CategoryID !== undefined) {
      request.input('CategoryID', sql.Int, CategoryID);
      updates.push('CategoryID = @CategoryID');
    }
    if (RoundNumber !== undefined) {
      request.input('RoundNumber', sql.Int, RoundNumber || null);
      updates.push('RoundNumber = @RoundNumber');
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
