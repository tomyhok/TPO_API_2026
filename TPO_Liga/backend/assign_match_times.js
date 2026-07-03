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

    // Fetch all matches
    const matchesRes = await sql.query(`SELECT MatchID FROM Matches`);
    const matches = matchesRes.recordset;
    
    console.log(`Found ${matches.length} matches in total to update.`);

    if (matches.length === 0) {
      console.log("No matches to update.");
      return;
    }

    let updateCount = 0;
    const batchSize = 200; // update in batches
    
    // Times we can assign, e.g. 18:00, 19:00, 20:00, 21:00
    const possibleHours = [18, 19, 20, 21, 22];
    const possibleMinutes = [0, 15, 30, 45];

    for (let i = 0; i < matches.length; i += batchSize) {
      const chunk = matches.slice(i, i + batchSize);
      
      const transaction = new sql.Transaction();
      await transaction.begin();
      try {
        for (const match of chunk) {
          const randomHour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
          const randomMinute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
          
          let dateObj = new Date();
          // We set time. We use UTC to ensure no timezone shift locally messes with the sql.Time mapping in mssql driver
          dateObj.setUTCHours(randomHour, randomMinute, 0, 0);
          
          await transaction.request()
            .input('MatchID', sql.Int, match.MatchID)
            .input('MatchTime', sql.Time, dateObj)
            .query('UPDATE Matches SET MatchTime = @MatchTime WHERE MatchID = @MatchID');
        }
        await transaction.commit();
        updateCount += chunk.length;
        console.log(`Updated ${updateCount} matches...`);
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    console.log(`Successfully assigned times to ${updateCount} matches.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.close();
  }
}

run();
