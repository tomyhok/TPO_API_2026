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
    const result = await sql.query('SELECT TOP 1 MatchTime FROM Matches WHERE MatchTime IS NOT NULL');
    console.log('MatchTime from DB:', result.recordset[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.close();
  }
}
run();
