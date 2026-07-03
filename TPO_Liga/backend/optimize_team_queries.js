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
    console.log('Creating team-specific indexes...');
    
    // Index on Matches (LocalTeamID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Matches_LocalTeam ON Matches (LocalTeamID, SeasonID)');
        console.log('Created IX_Matches_LocalTeam');
    } catch(e) { console.log('Error LocalTeam:', e.message); }

    // Index on Matches (VisitorTeamID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_Matches_VisitorTeam ON Matches (VisitorTeamID, SeasonID)');
        console.log('Created IX_Matches_VisitorTeam');
    } catch(e) { console.log('Error VisitorTeam:', e.message); }

    // Index on PlayerSeasons (TeamID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_PlayerSeasons_Team ON PlayerSeasons (TeamID, SeasonID)');
        console.log('Created IX_PlayerSeasons_Team');
    } catch(e) { console.log('Error PlayerSeasons:', e.message); }

    // Index on TeamChampionships (TeamID)
    try {
        await pool.request().query('CREATE NONCLUSTERED INDEX IX_TeamChampionships_Team ON TeamChampionships (TeamID)');
        console.log('Created IX_TeamChampionships_Team');
    } catch(e) { console.log('Error TeamChampionships:', e.message); }

    console.log('Optimization complete.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.close();
  }
}
optimize();
