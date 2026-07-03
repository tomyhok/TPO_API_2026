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

    // Find the 2024 season
    const seasonsRes = await sql.query("SELECT * FROM Seasons WHERE SeasonID = 1 OR Name = 'Temporada 2024'");
    if (seasonsRes.recordset.length === 0) {
      console.log("No season found containing '2024' in its name.");
      return;
    }
    
    const seasonId = seasonsRes.recordset[0].SeasonID;
    console.log(`Found Season: ${seasonsRes.recordset[0].Name} (ID: ${seasonId})`);

    // Fetch all matches for this season without results
    const matchesRes = await sql.query(`SELECT MatchID FROM Matches WHERE SeasonID = ${seasonId}`);
    const matches = matchesRes.recordset;
    
    console.log(`Found ${matches.length} matches in this season.`);

    if (matches.length === 0) {
      console.log("No matches to update.");
      return;
    }

    // Generate random scores
    const minScore = 60;
    const maxScore = 120;
    
    let updateCount = 0;
    const batchSize = 200; // update in batches

    for (let i = 0; i < matches.length; i += batchSize) {
      const chunk = matches.slice(i, i + batchSize);
      
      const transaction = new sql.Transaction();
      await transaction.begin();
      try {
        for (const match of chunk) {
          const localPoints = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
          const visitorPoints = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
          
          await transaction.request()
            .input('MatchID', sql.Int, match.MatchID)
            .input('LocalPoints', sql.Int, localPoints)
            .input('VisitorPoints', sql.Int, visitorPoints)
            .query('UPDATE Matches SET LocalPoints = @LocalPoints, VisitorPoints = @VisitorPoints WHERE MatchID = @MatchID');
        }
        await transaction.commit();
        updateCount += chunk.length;
        console.log(`Updated ${updateCount} matches...`);
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    console.log(`Successfully assigned results to ${updateCount} matches in season 2025.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.close();
  }
}

run();
