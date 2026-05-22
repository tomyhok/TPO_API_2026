const { sql, poolPromise } = require('../config/db');

class StandingModel {
  static async getStandings() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM [v_Standings] ORDER BY [Puntos] DESC');
    return result.recordset;
  }
}

module.exports = StandingModel;
