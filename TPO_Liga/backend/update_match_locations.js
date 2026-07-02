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

async function updateMatchLocations() {
  try {
    let pool = await sql.connect(config);
    
    console.log("Actualizando la sede de los partidos basándose en el equipo local...");
    
    const query = `
      UPDATE Matches
      SET Location = Teams.StadiumName
      FROM Matches
      INNER JOIN Teams ON Matches.LocalTeamID = Teams.TeamID
      WHERE Teams.StadiumName IS NOT NULL
    `;
    
    const result = await pool.request().query(query);
    
    console.log(`¡Proceso finalizado! Se actualizaron ${result.rowsAffected[0]} partidos con su estadio correspondiente.`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit();
  }
}

updateMatchLocations();
