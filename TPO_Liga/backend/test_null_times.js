const sql = require('mssql');
const { config } = require('dotenv');
config();

const dbConfig = {
  user: process.env.DB_USER || 'sqladmin',
  password: process.env.DB_PASSWORD || 'TpoApis2026!',
  server: process.env.DB_SERVER || 'apiuade.database.windows.net',
  database: process.env.DB_NAME || 'LigaJuvenilUade',
  options: { encrypt: true, trustServerCertificate: false }
};

async function run() {
  try {
    await sql.connect(dbConfig);
    const nulls = await sql.query('SELECT COUNT(*) as count FROM Matches WHERE MatchTime IS NULL');
    console.log('Matches with NULL time:', nulls.recordset[0].count);
    
    const unplayed = await sql.query('SELECT COUNT(*) as count FROM Matches WHERE LocalPoints IS NULL');
    console.log('Unplayed matches total:', unplayed.recordset[0].count);
    
    const unplayedNullTime = await sql.query('SELECT COUNT(*) as count FROM Matches WHERE LocalPoints IS NULL AND MatchTime IS NULL');
    console.log('Unplayed matches with NULL time:', unplayedNullTime.recordset[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.close();
  }
}
run();
