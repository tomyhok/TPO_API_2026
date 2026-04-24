const { sql, poolPromise } = require('../config/db');

exports.getStandings = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM [v_Standings] ORDER BY [Puntos] DESC');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
