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
        
        // Generar fixture (ida y vuelta) automáticamente para la nueva temporada
        const teamsRes = await transaction.request()
          .input('SeasonForMatches', sql.Int, newSeason.SeasonID)
          .query('SELECT TeamID FROM TeamSeasons WHERE SeasonID = @SeasonForMatches');
        
        const teams = teamsRes.recordset.map(t => t.TeamID);
        
        if (teams.length >= 2) {
          const catRes = await transaction.request().query('SELECT CategoryID FROM Categories');
          const categories = catRes.recordset.map(c => c.CategoryID);
          
          let roundRobinTeams = [...teams];
          if (roundRobinTeams.length % 2 !== 0) roundRobinTeams.push(null);
          
          const numTeams = roundRobinTeams.length;
          const rounds = numTeams - 1;
          const half = numTeams / 2;
          
          let matches = [];
          for (let round = 1; round <= rounds; round++) {
            for (let i = 0; i < half; i++) {
              const home = roundRobinTeams[i];
              const away = roundRobinTeams[numTeams - 1 - i];
              if (home !== null && away !== null) {
                matches.push({ round, home, away });
              }
            }
            roundRobinTeams.splice(1, 0, roundRobinTeams.pop());
          }
          
          const matchesVuelta = matches.map(m => ({
            round: m.round + rounds,
            home: m.away,
            away: m.home
          }));
          
          const allMatches = [...matches, ...matchesVuelta];
          
          let baseDate = StartDate ? new Date(StartDate) : new Date();
          
          let insertValues = [];
          
          for (const match of allMatches) {
            let matchDate = new Date(baseDate);
            matchDate.setDate(matchDate.getDate() + (match.round - 1) * 7);
            const dateString = matchDate.toISOString().split('T')[0];
            
            for (const cat of categories) {
              insertValues.push({
                LocTeamID: match.home,
                VisTeamID: match.away,
                SeaID: newSeason.SeasonID,
                CatID: cat,
                RndNumber: match.round,
                MDate: dateString
              });
            }
          }
          
          // Chunk inserts to avoid exceeding the 2100 parameter limit in SQL Server
          // We have 6 parameters per row, so max rows per chunk is 350.
          const chunkSize = 300;
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            const req = transaction.request();
            
            let valuesClauses = [];
            chunk.forEach((row, idx) => {
              req.input(`loc${idx}`, sql.Int, row.LocTeamID);
              req.input(`vis${idx}`, sql.Int, row.VisTeamID);
              req.input(`sea${idx}`, sql.Int, row.SeaID);
              req.input(`cat${idx}`, sql.Int, row.CatID);
              req.input(`rnd${idx}`, sql.Int, row.RndNumber);
              req.input(`mdate${idx}`, sql.Date, row.MDate);
              
              valuesClauses.push(`(@loc${idx}, @vis${idx}, @sea${idx}, @cat${idx}, @rnd${idx}, @mdate${idx})`);
            });
            
            const query = `
              INSERT INTO Matches (LocalTeamID, VisitorTeamID, SeasonID, CategoryID, RoundNumber, MatchDate) 
              VALUES ${valuesClauses.join(', ')}
            `;
            await req.query(query);
          }
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

  static async finishSeason(id) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if already finished
      const checkRes = await transaction.request().input('SeasonID', sql.Int, id).query('SELECT IsFinished FROM Seasons WHERE SeasonID = @SeasonID');
      if (checkRes.recordset.length === 0 || checkRes.recordset[0].IsFinished) {
        throw new Error('Season already finished or not found.');
      }

      // 1. Mark as finished
      await transaction.request()
        .input('SeasonID2', sql.Int, id)
        .query('UPDATE Seasons SET IsFinished = 1, IsActive = 0 WHERE SeasonID = @SeasonID2');

      // 2. Determine champions
      // Use v_Standings to get the top team per category
      const standingsRes = await transaction.request()
        .input('SeasonID3', sql.Int, id)
        .query('SELECT TeamID, CategoryName FROM v_Standings WHERE SeasonID = @SeasonID3 ORDER BY CategoryID, Puntos DESC, DiferenciaDeTantos DESC, TantosAFavor DESC');
      
      const standings = standingsRes.recordset;
      const categoriesProcessed = new Set();
      
      for (const row of standings) {
        if (!categoriesProcessed.has(row.CategoryName)) {
          // Top team for this category
          categoriesProcessed.add(row.CategoryName);
          
          await transaction.request()
            .input('TeamID', sql.Int, row.TeamID)
            .input('SeasonID4', sql.Int, id)
            .input('CatName', sql.NVarChar, row.CategoryName)
            .query('INSERT INTO TeamChampionships (TeamID, SeasonID, CategoryName) VALUES (@TeamID, @SeasonID4, @CatName)');
        }
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async revertFinish(id) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if finished
      const checkRes = await transaction.request().input('SeasonID', sql.Int, id).query('SELECT IsFinished FROM Seasons WHERE SeasonID = @SeasonID');
      if (checkRes.recordset.length === 0 || !checkRes.recordset[0].IsFinished) {
        throw new Error('Season is not finished or not found.');
      }

      // 1. Delete championships for this season
      await transaction.request()
        .input('SeasonID2', sql.Int, id)
        .query('DELETE FROM TeamChampionships WHERE SeasonID = @SeasonID2');

      // 2. Mark as not finished (we can make it active again if we want, but let's just make it not finished, user can activate manually if needed)
      await transaction.request()
        .input('SeasonID3', sql.Int, id)
        .query('UPDATE Seasons SET IsFinished = 0 WHERE SeasonID = @SeasonID3');

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = SeasonModel;
