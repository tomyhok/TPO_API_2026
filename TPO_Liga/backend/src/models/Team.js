const { sql, poolPromise } = require('../config/db');

class TeamModel {
  static async create(Name, Coach, LogoURL, seasonId, StadiumName) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = transaction.request()
        .input('Name', sql.NVarChar, Name)
        .input('Coach', sql.NVarChar, Coach)
        .input('LogoURL', sql.NVarChar, LogoURL || null)
        .input('StadiumName', sql.NVarChar, StadiumName || null);
        
      var result = await request.query('INSERT INTO Teams (Name, Coach, LogoURL, StadiumName) OUTPUT INSERTED.* VALUES (@Name, @Coach, @LogoURL, @StadiumName)');
      
      const newTeam = result.recordset[0];

      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const activeRes = await transaction.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
        if (activeRes.recordset.length > 0) {
          targetSeasonId = activeRes.recordset[0].SeasonID;
        }
      }

      if (targetSeasonId) {
        await transaction.request()
          .input('TeamID', sql.Int, newTeam.TeamID)
          .input('SeasonID', sql.Int, targetSeasonId)
          .query('INSERT INTO TeamSeasons (TeamID, SeasonID) VALUES (@TeamID, @SeasonID)');
      }

      await transaction.commit();
      return newTeam;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getAll(seasonId) {
    const pool = await poolPromise;
    const request = pool.request();
    
    let query = 'SELECT * FROM Teams';
    if (seasonId) {
      request.input('SeasonID', sql.Int, seasonId);
      query = `
        SELECT t.* FROM Teams t
        INNER JOIN TeamSeasons ts ON t.TeamID = ts.TeamID
        WHERE ts.SeasonID = @SeasonID
      `;
    } else {
      // Por defecto temporada activa si no se provee
      query = `
        SELECT t.* FROM Teams t
        INNER JOIN TeamSeasons ts ON t.TeamID = ts.TeamID
        INNER JOIN Seasons s ON ts.SeasonID = s.SeasonID
        WHERE s.IsActive = 1
      `;
    }

    const result = await request.query(query);
    return result.recordset;
  }

  static async getById(id, seasonId) {
    const pool = await poolPromise;
    
    // 1. Obtener información básica del equipo
    const teamResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Teams WHERE TeamID = @TeamID');

    if (teamResult.recordset.length === 0) {
      return null;
    }
    const team = teamResult.recordset[0];

    const request = pool.request().input('TeamID', sql.Int, id);

    let pQuery = 'SELECT * FROM Players WHERE TeamID = @TeamID'; // Legacy fallback
    let mQuery = 'SELECT * FROM Matches WHERE (LocalTeamID = @TeamID OR VisitorTeamID = @TeamID) ORDER BY MatchDate DESC';
    
    if (seasonId) {
      request.input('SeasonID', sql.Int, seasonId);
      pQuery = `
        SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, p.JerseyNumber, p.Position, c.Name AS CategoryName, ps.TeamID
        FROM Players p
        INNER JOIN Categories c ON p.CategoryID = c.CategoryID
        INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
        WHERE ps.TeamID = @TeamID AND ps.SeasonID = @SeasonID
      `;
      mQuery = `
        SELECT m.*, c.Name AS CategoryName,
               tLocal.Name AS LocalTeamName, tVisitor.Name AS VisitorTeamName
        FROM Matches m
        INNER JOIN Categories c ON m.CategoryID = c.CategoryID
        INNER JOIN Teams tLocal ON m.LocalTeamID = tLocal.TeamID
        INNER JOIN Teams tVisitor ON m.VisitorTeamID = tVisitor.TeamID
        WHERE m.LocalTeamID = @TeamID AND m.SeasonID = @SeasonID
        UNION
        SELECT m.*, c.Name AS CategoryName,
               tLocal.Name AS LocalTeamName, tVisitor.Name AS VisitorTeamName
        FROM Matches m
        INNER JOIN Categories c ON m.CategoryID = c.CategoryID
        INNER JOIN Teams tLocal ON m.LocalTeamID = tLocal.TeamID
        INNER JOIN Teams tVisitor ON m.VisitorTeamID = tVisitor.TeamID
        WHERE m.VisitorTeamID = @TeamID AND m.SeasonID = @SeasonID
        ORDER BY MatchDate DESC
      `;
    } else {
      // Default to active season
      pQuery = `
        SELECT p.PlayerID, p.FirstName, p.LastName, p.CategoryID, p.JerseyNumber, p.Position, c.Name AS CategoryName, ps.TeamID
        FROM Players p
        INNER JOIN Categories c ON p.CategoryID = c.CategoryID
        INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
        INNER JOIN Seasons s ON ps.SeasonID = s.SeasonID
        WHERE ps.TeamID = @TeamID AND s.IsActive = 1
      `;
      mQuery = `
        SELECT m.*, c.Name AS CategoryName,
               tLocal.Name AS LocalTeamName, tVisitor.Name AS VisitorTeamName
        FROM Matches m
        INNER JOIN Categories c ON m.CategoryID = c.CategoryID
        INNER JOIN Teams tLocal ON m.LocalTeamID = tLocal.TeamID
        INNER JOIN Teams tVisitor ON m.VisitorTeamID = tVisitor.TeamID
        INNER JOIN Seasons s ON m.SeasonID = s.SeasonID
        WHERE m.LocalTeamID = @TeamID AND s.IsActive = 1
        UNION
        SELECT m.*, c.Name AS CategoryName,
               tLocal.Name AS LocalTeamName, tVisitor.Name AS VisitorTeamName
        FROM Matches m
        INNER JOIN Categories c ON m.CategoryID = c.CategoryID
        INNER JOIN Teams tLocal ON m.LocalTeamID = tLocal.TeamID
        INNER JOIN Teams tVisitor ON m.VisitorTeamID = tVisitor.TeamID
        INNER JOIN Seasons s ON m.SeasonID = s.SeasonID
        WHERE m.VisitorTeamID = @TeamID AND s.IsActive = 1
        ORDER BY MatchDate DESC
      `;
    }

    // Execute queries in parallel to drastically improve response time
    const reqPlayers = pool.request().input('TeamID', sql.Int, id);
    const reqMatches = pool.request().input('TeamID', sql.Int, id);
    const reqChamps = pool.request().input('TeamID', sql.Int, id);

    if (seasonId) {
      reqPlayers.input('SeasonID', sql.Int, seasonId);
      reqMatches.input('SeasonID', sql.Int, seasonId);
    }

    const champQuery = `
      SELECT tc.ChampionshipID, tc.CategoryName, tc.SeasonID, s.Name AS SeasonName, s.StartDate
      FROM TeamChampionships tc
      INNER JOIN Seasons s ON tc.SeasonID = s.SeasonID
      WHERE tc.TeamID = @TeamID
      ORDER BY s.StartDate DESC
    `;

    const [playersResult, matchesResult, champResult] = await Promise.all([
      reqPlayers.query(pQuery),
      reqMatches.query(mQuery),
      reqChamps.query(champQuery)
    ]);

    // 2. Asignar lista de jugadores del equipo
    team.Players = playersResult.recordset;

    // 3. Asignar partidos asociados al equipo
    const allMatches = matchesResult.recordset;
    
    // Clasificar partidos en jugados (tienen resultado) y pendientes (no tienen resultado)
    team.PlayedMatches = allMatches.filter(m => m.LocalPoints !== null && m.VisitorPoints !== null);
    team.PendingMatches = allMatches.filter(m => m.LocalPoints === null || m.VisitorPoints === null);
    team.Results = team.PlayedMatches;

    // 4. Asignar campeonatos del equipo
    team.Championships = champResult.recordset;

    return team;
  }

  static async update(id, Name, Coach, LogoURL, StadiumName) {
    const pool = await poolPromise;
    const request = pool.request().input('TeamID', sql.Int, id);
    
    let updates = [];
    if (Name !== undefined) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (Coach !== undefined) {
      request.input('Coach', sql.NVarChar, Coach);
      updates.push('Coach = @Coach');
    }
    if (LogoURL !== undefined) {
      request.input('LogoURL', sql.NVarChar, LogoURL);
      updates.push('LogoURL = @LogoURL');
    }
    if (StadiumName !== undefined) {
      request.input('StadiumName', sql.NVarChar, StadiumName);
      updates.push('StadiumName = @StadiumName');
    }
    if (updates.length === 0) return null;
    
    const query = `UPDATE Teams SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE TeamID = @TeamID`;
    const result = await request.query(query);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = transaction.request().input('TeamID', sql.Int, id);
      await request.query('DELETE FROM TeamSeasons WHERE TeamID = @TeamID');
      const result = await request.query('DELETE FROM Teams WHERE TeamID = @TeamID');
      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = TeamModel;
