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

async function optimize() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Check existing indexes
    const checkQuery = `
      SELECT 
        t.name as TableName,
        i.name as IndexName,
        i.type_desc
      FROM sys.indexes i
      JOIN sys.tables t ON i.object_id = t.object_id
      WHERE t.is_ms_shipped = 0 AND i.type > 0;
    `;
    const checkRes = await pool.request().query(checkQuery);
    console.log('Existing indexes:', checkRes.recordset);

    console.log('Creating optimized indexes...');
    
    // Index on Matches (SeasonID, CategoryID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Matches_Season_Category ON Matches (SeasonID, CategoryID) INCLUDE (HomeTeamID, AwayTeamID, HomeScore, AwayScore, MatchDate, MatchTime, Location)');
        console.log('Created IX_Matches_Season_Category');
    } catch(e) { console.log('Index probably exists or error:', e.message); }

    // Sometimes columns are named LocalTeamID/VisitorTeamID/LocalPoints/VisitorPoints
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Matches_Season_Category_Alt ON Matches (SeasonID, CategoryID) INCLUDE (LocalTeamID, VisitorTeamID, LocalPoints, VisitorPoints, MatchDate, MatchTime, Location)');
        console.log('Created IX_Matches_Season_Category_Alt');
    } catch(e) { console.log('Index Alt probably exists or error:', e.message); }

    // Index on Teams (SeasonID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Teams_Season ON Teams (SeasonID)');
        console.log('Created IX_Teams_Season');
    } catch(e) { console.log('Index Teams probably exists or error:', e.message); }

    // Index on Players (TeamID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Players_Team ON Players (TeamID)');
        console.log('Created IX_Players_Team');
    } catch(e) { console.log('Index Players probably exists or error:', e.message); }

    console.log('Optimization complete.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.close();
  }
}
optimize();
