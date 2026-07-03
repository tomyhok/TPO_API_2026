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
    console.log("Connected to DB.");

    const query = `
      UPDATE Matches 
      SET MatchTime = DATEADD(minute, (ABS(CHECKSUM(NEWID())) % 241), CAST('18:00:00' AS TIME))
      WHERE MatchTime IS NULL
    `;
    const result = await sql.query(query);
    console.log(`Successfully assigned times to ${result.rowsAffected[0]} matches.`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.close();
  }
}

run();
