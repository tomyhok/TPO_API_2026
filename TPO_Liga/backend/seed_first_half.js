require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false 
  }
};

function getRandomPoints() {
  return Math.floor(Math.random() * (110 - 60 + 1)) + 60;
}

async function seedFirstHalf() {
  try {
    let pool = await sql.connect(config);
    
    // Obtener la temporada activa
    const seasonRes = await pool.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
    if (seasonRes.recordset.length === 0) {
      console.log('No hay temporada activa.');
      return;
    }
    const seasonId = seasonRes.recordset[0].SeasonID;

    // Traer todos los partidos de las primeras 19 fechas que no tengan resultado
    const matchesRes = await pool.request()
      .input('SeasonID', sql.Int, seasonId)
      .query('SELECT MatchID FROM Matches WHERE SeasonID = @SeasonID AND RoundNumber <= 19 AND LocalPoints IS NULL');
    
    const matchesToUpdate = matchesRes.recordset;
    
    if (matchesToUpdate.length === 0) {
      console.log('No hay partidos sin resultado en las primeras 19 fechas.');
      return;
    }

    console.log(`Generando resultados para ${matchesToUpdate.length} partidos...`);
    let updatedCount = 0;

    for (const match of matchesToUpdate) {
      let lp = getRandomPoints();
      let vp = getRandomPoints();
      while (lp === vp) {
        vp = getRandomPoints(); // Evitar empates en básquet
      }

      await pool.request()
        .input('LocalPoints', sql.Int, lp)
        .input('VisitorPoints', sql.Int, vp)
        .input('MatchID', sql.Int, match.MatchID)
        .query('UPDATE Matches SET LocalPoints = @LocalPoints, VisitorPoints = @VisitorPoints WHERE MatchID = @MatchID');
      
      updatedCount++;
    }

    console.log(`¡Éxito! Se asignaron resultados aleatorios a ${updatedCount} partidos de la primera mitad.`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit();
  }
}

seedFirstHalf();
