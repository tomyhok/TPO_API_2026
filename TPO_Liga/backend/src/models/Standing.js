const { sql, poolPromise } = require('../config/db');

class StandingModel {
  static async getStandings(seasonId) {
    const pool = await poolPromise;
    const request = pool.request();
    let query;
    if (seasonId) {
      request.input('SeasonID', sql.Int, seasonId);
      query = `
        SELECT * FROM v_Standings
        WHERE SeasonID = @SeasonID
        ORDER BY Puntos DESC, DiferenciaDeTantos DESC, TantosAFavor DESC
      `;
    } else {
      query = `
        SELECT v.* FROM v_Standings v
        INNER JOIN Seasons s ON v.SeasonID = s.SeasonID
        WHERE s.IsActive = 1
        ORDER BY v.Puntos DESC, v.DiferenciaDeTantos DESC, v.TantosAFavor DESC
      `;
    }
    const result = await request.query(query);
    return result.recordset;
  }
}

module.exports = StandingModel;
