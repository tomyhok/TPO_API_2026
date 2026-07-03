const sql = require('mssql');
const { config } = require('dotenv');

config();

const dbConfig = {
  user: process.env.DB_USER || 'sqladmin',
  password: process.env.DB_PASSWORD || 'TpoApis2026!',
  server: process.env.DB_SERVER || 'apiuade.database.windows.net',
  database: process.env.DB_NAME || 'LigaJuvenilUade',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function run() {
  try {
    await sql.connect(dbConfig);
    const seasonsRes = await sql.query("SELECT SeasonID, Name, StartDate FROM Seasons");
    console.table(seasonsRes.recordset);
    
    const matchesRes = await sql.query("SELECT SeasonID, COUNT(*) as MatchCount FROM Matches GROUP BY SeasonID");
    console.table(matchesRes.recordset);
  } finally {
    await sql.close();
  }
}
run();
