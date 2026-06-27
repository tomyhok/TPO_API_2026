const { sql, poolPromise } = require('../config/db');

class SeasonModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Seasons ORDER BY IsActive DESC, StartDate DESC');
    return result.recordset;
  }

  static async getActive() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT TOP 1 * FROM Seasons WHERE IsActive = 1');
    return result.recordset[0];
  }

  static async create(Name, StartDate, EndDate, IsActive, copyTeams = true, copyPlayers = true) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let previousSeasonId = null;

      // Buscar la última temporada (preferiblemente la activa, o simplemente la última creada)
      const prevSeasonRes = await transaction.request().query('SELECT TOP 1 SeasonID FROM Seasons ORDER BY IsActive DESC, SeasonID DESC');
      if (prevSeasonRes.recordset.length > 0) {
        previousSeasonId = prevSeasonRes.recordset[0].SeasonID;
      }

      // Si la nueva es activa, desactivamos el resto
      if (IsActive) {
        await transaction.request().query('UPDATE Seasons SET IsActive = 0');
      }

      const result = await transaction.request()
        .input('Name', sql.NVarChar, Name)
        .input('StartDate', sql.Date, StartDate || null)
        .input('EndDate', sql.Date, EndDate || null)
        .input('IsActive', sql.Bit, IsActive ? 1 : 0)
        .query('INSERT INTO Seasons (Name, StartDate, EndDate, IsActive) OUTPUT INSERTED.* VALUES (@Name, @StartDate, @EndDate, @IsActive)');
      
      const newSeason = result.recordset[0];

      // Migrar los equipos de la temporada anterior a la nueva
      if (previousSeasonId && copyTeams) {
        await transaction.request()
          .input('NewSeasonID', sql.Int, newSeason.SeasonID)
          .input('OldSeasonID', sql.Int, previousSeasonId)
          .query(`
            INSERT INTO TeamSeasons (TeamID, SeasonID)
            SELECT TeamID, @NewSeasonID FROM TeamSeasons WHERE SeasonID = @OldSeasonID
          `);
          
        // Migrar los jugadores si se solicitó (y solo si se copiaron los equipos)
        if (copyPlayers) {
          await transaction.request()
            .input('NewSeasonID2', sql.Int, newSeason.SeasonID)
            .input('OldSeasonID2', sql.Int, previousSeasonId)
            .query(`
              INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID)
              SELECT PlayerID, @NewSeasonID2, TeamID FROM PlayerSeasons WHERE SeasonID = @OldSeasonID2
            `);
        }
      }

      await transaction.commit();
      return newSeason;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async update(id, Name, StartDate, EndDate, IsActive) {
    const pool = await poolPromise;

    if (IsActive) {
      await pool.request().query('UPDATE Seasons SET IsActive = 0');
    }

    const request = pool.request().input('SeasonID', sql.Int, id);
    let updates = [];

    if (Name !== undefined) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (StartDate !== undefined) {
      request.input('StartDate', sql.Date, StartDate || null);
      updates.push('StartDate = @StartDate');
    }
    if (EndDate !== undefined) {
      request.input('EndDate', sql.Date, EndDate || null);
      updates.push('EndDate = @EndDate');
    }
    if (IsActive !== undefined) {
      request.input('IsActive', sql.Bit, IsActive ? 1 : 0);
      updates.push('IsActive = @IsActive');
    }

    if (updates.length === 0) return null;

    const query = `UPDATE Seasons SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE SeasonID = @SeasonID`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const req = transaction.request().input('SeasonID', sql.Int, id);
      
      // We must delete dependent records in other tables first to avoid foreign key violations.
      // 1. Matches
      await req.query('DELETE FROM Matches WHERE SeasonID = @SeasonID');
      // 2. PlayerSeasons
      await req.query('DELETE FROM PlayerSeasons WHERE SeasonID = @SeasonID');
      // 3. TeamSeasons
      await req.query('DELETE FROM TeamSeasons WHERE SeasonID = @SeasonID');
      
      // Finally, delete the season
      const result = await req.query('DELETE FROM Seasons WHERE SeasonID = @SeasonID');
      
      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = SeasonModel;
