const { sql, poolPromise } = require('../config/db');

class TeamModel {
  static async create(Name, Coach) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Coach', sql.NVarChar, Coach)
      .query('INSERT INTO Teams (Name, Coach) OUTPUT INSERTED.* VALUES (@Name, @Coach)');
    return result.recordset[0];
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Teams');
    return result.recordset;
  }

  static async getById(id) {
    const pool = await poolPromise;
    
    // 1. Obtener información básica del equipo
    const teamResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Teams WHERE TeamID = @TeamID');

    if (teamResult.recordset.length === 0) {
      return null;
    }
    const team = teamResult.recordset[0];

    // 2. Obtener lista de jugadores del equipo
    const playersResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Players WHERE TeamID = @TeamID');
    team.Players = playersResult.recordset;

    // 3. Obtener partidos asociados al equipo
    const matchesResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Matches WHERE LocalTeamID = @TeamID OR VisitorTeamID = @TeamID ORDER BY MatchDate DESC');
    
    const allMatches = matchesResult.recordset;
    
    // Clasificar partidos en jugados (tienen resultado) y pendientes (no tienen resultado)
    team.PlayedMatches = allMatches.filter(m => m.LocalPoints !== null && m.VisitorPoints !== null);
    team.PendingMatches = allMatches.filter(m => m.LocalPoints === null || m.VisitorPoints === null);
    
    // Resultados obtenidos
    team.Results = team.PlayedMatches;

    return team;
  }

  static async update(id, Name, Coach) {
    const pool = await poolPromise;
    const request = pool.request().input('TeamID', sql.Int, id);
    
    let updates = [];
    
    if (Name) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (Coach) {
      request.input('Coach', sql.NVarChar, Coach);
      updates.push('Coach = @Coach');
    }
    
    const query = `UPDATE Teams SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE TeamID = @TeamID`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('DELETE FROM Teams WHERE TeamID = @TeamID');
    
    return result.rowsAffected[0] > 0;
  }
}

module.exports = TeamModel;
