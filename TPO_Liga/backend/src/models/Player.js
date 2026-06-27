const { sql, poolPromise } = require('../config/db');

class PlayerModel {
  static async create(TeamID, FirstName, LastName, CategoryID, seasonId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Create player
      const result = await transaction.request()
        .input('TeamID', sql.Int, TeamID) // keep legacy for now
        .input('FirstName', sql.NVarChar, FirstName)
        .input('LastName', sql.NVarChar, LastName)
        .input('CategoryID', sql.Int, CategoryID)
        .query('INSERT INTO Players (TeamID, FirstName, LastName, CategoryID) OUTPUT INSERTED.* VALUES (@TeamID, @FirstName, @LastName, @CategoryID)');
      const newPlayer = result.recordset[0];

      // 2. Resolve season
      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const activeRes = await transaction.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
        if (activeRes.recordset.length > 0) targetSeasonId = activeRes.recordset[0].SeasonID;
      }

      // 3. Create PlayerSeasons mapping
      if (targetSeasonId) {
        await transaction.request()
          .input('PlayerID', sql.Int, newPlayer.PlayerID)
          .input('SeasonID', sql.Int, targetSeasonId)
          .input('TeamID', sql.Int, TeamID)
          .query('INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID) VALUES (@PlayerID, @SeasonID, @TeamID)');
      }

      await transaction.commit();
      newPlayer.TeamID = TeamID;
      return newPlayer;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getAll(seasonId) {
    const pool = await poolPromise;
    const request = pool.request();
    let query;
    if (seasonId) {
       request.input('SeasonID', sql.Int, seasonId);
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
         WHERE ps.SeasonID = @SeasonID
       `;
    } else {
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
         INNER JOIN Seasons s ON ps.SeasonID = s.SeasonID
         WHERE s.IsActive = 1
       `;
    }
    const result = await request.query(query);
    return result.recordset;
  }

  static async getById(id, seasonId) {
    const pool = await poolPromise;
    const request = pool.request().input('PlayerID', sql.Int, id);
    let query;
    if (seasonId) {
       request.input('SeasonID', sql.Int, seasonId);
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         LEFT JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID AND ps.SeasonID = @SeasonID
         WHERE p.PlayerID = @PlayerID
       `;
    } else {
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         LEFT JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
         LEFT JOIN Seasons s ON ps.SeasonID = s.SeasonID
         WHERE p.PlayerID = @PlayerID AND (s.IsActive = 1 OR s.IsActive IS NULL)
       `;
    }
    const result = await request.query(query);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async getByTeamId(teamId, seasonId) {
    const pool = await poolPromise;
    const request = pool.request().input('TeamID', sql.Int, teamId);
    let query;
    if (seasonId) {
       request.input('SeasonID', sql.Int, seasonId);
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
         WHERE ps.TeamID = @TeamID AND ps.SeasonID = @SeasonID
       `;
    } else {
       query = `
         SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID
         FROM Players p
         INNER JOIN Categories c ON p.CategoryID = c.CategoryID
         INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
         INNER JOIN Seasons s ON ps.SeasonID = s.SeasonID
         WHERE ps.TeamID = @TeamID AND s.IsActive = 1
       `;
    }
    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id, TeamID, FirstName, LastName, CategoryID, seasonId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = transaction.request().input('PlayerID', sql.Int, id);
      let updates = [];
      
      // Update core player details
      if (FirstName !== undefined) {
        request.input('FirstName', sql.NVarChar, FirstName);
        updates.push('FirstName = @FirstName');
      }
      if (LastName !== undefined) {
        request.input('LastName', sql.NVarChar, LastName);
        updates.push('LastName = @LastName');
      }
      if (CategoryID !== undefined) {
        request.input('CategoryID', sql.Int, CategoryID);
        updates.push('CategoryID = @CategoryID');
      }
      
      if (updates.length > 0) {
        await request.query(`UPDATE Players SET ${updates.join(', ')} WHERE PlayerID = @PlayerID`);
      }

      // Resolve season
      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const activeRes = await transaction.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
        if (activeRes.recordset.length > 0) targetSeasonId = activeRes.recordset[0].SeasonID;
      }

      // Update TeamID for the specific season
      if (TeamID !== undefined && targetSeasonId) {
        const tsReq = transaction.request()
          .input('PlayerID', sql.Int, id)
          .input('SeasonID', sql.Int, targetSeasonId)
          .input('TeamID', sql.Int, TeamID);
        
        const existing = await tsReq.query('SELECT * FROM PlayerSeasons WHERE PlayerID = @PlayerID AND SeasonID = @SeasonID');
        if (existing.recordset.length > 0) {
          await tsReq.query('UPDATE PlayerSeasons SET TeamID = @TeamID WHERE PlayerID = @PlayerID AND SeasonID = @SeasonID');
        } else {
          await tsReq.query('INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID) VALUES (@PlayerID, @SeasonID, @TeamID)');
        }
      }

      await transaction.commit();
      
      // Fetch updated
      const resRequest = pool.request().input('PlayerID', sql.Int, id);
      if (targetSeasonId) resRequest.input('SeasonID', sql.Int, targetSeasonId);
      
      const resResult = await resRequest.query(
        targetSeasonId 
          ? 'SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, ps.TeamID FROM Players p INNER JOIN Categories c ON p.CategoryID = c.CategoryID LEFT JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID AND ps.SeasonID = @SeasonID WHERE p.PlayerID = @PlayerID'
          : 'SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, c.Name AS CategoryName, p.TeamID FROM Players p INNER JOIN Categories c ON p.CategoryID = c.CategoryID WHERE p.PlayerID = @PlayerID'
      );
      return resResult.recordset.length > 0 ? resResult.recordset[0] : null;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async delete(id) {
    const pool = await poolPromise;
    const request = pool.request().input('PlayerID', sql.Int, id);
    await request.query('DELETE FROM PlayerSeasons WHERE PlayerID = @PlayerID');
    const result = await request.query('DELETE FROM Players WHERE PlayerID = @PlayerID');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = PlayerModel;
