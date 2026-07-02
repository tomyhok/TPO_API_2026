require('dotenv').config({ path: '../.env' });
const { sql, poolPromise } = require('../src/config/db');

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function runSeed() {
  try {
    const pool = await poolPromise;
    console.log('Connected to DB');

    // Get Active Season
    const seasonRes = await pool.request().query('SELECT TOP 1 SeasonID FROM Seasons WHERE IsActive = 1');
    if (seasonRes.recordset.length === 0) {
      console.log('No active season found.');
      process.exit(1);
    }
    const seasonId = seasonRes.recordset[0].SeasonID;

    // Get Teams
    const teamsRes = await pool.request().query('SELECT TeamID FROM Teams');
    const teams = teamsRes.recordset.map(t => t.TeamID);

    // Get Categories
    const catRes = await pool.request().query('SELECT CategoryID, Name FROM Categories');
    const categories = catRes.recordset;

    let matchCount = 0;
    
    // Clear existing matches for this season to avoid duplicates if run multiple times
    await pool.request()
      .input('SeasonID', sql.Int, seasonId)
      .query('DELETE FROM Matches'); // This deletes all matches. If they want to keep old matches, they shouldn't run this. But we can just append. Let's not delete just in case.

    console.log(`Generating matches for ${teams.length} teams and ${categories.length} categories...`);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2); // Start 2 months ago

    let matchDayOffset = 0;

    // Round Robin Algorithm for Ida
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamA = teams[i];
        const teamB = teams[j];

        // Assign a date for this matchup
        const matchDateIda = addDays(startDate, matchDayOffset);
        // Vuelta is 60 days after Ida
        const matchDateVuelta = addDays(matchDateIda, 60);

        for (const cat of categories) {
          // IDA: Team A is Local
          let localPointsIda = getRandomNumber(60, 110);
          let visitorPointsIda = getRandomNumber(60, 110);
          while (localPointsIda === visitorPointsIda) visitorPointsIda = getRandomNumber(60, 110); // no ties in basketball

          // Create a valid Date object for time (tedious requires Date objects for sql.Time)
          const matchTimeObj = new Date();
          matchTimeObj.setUTCHours(20, 0, 0, 0);

          await pool.request()
            .input('LocalTeamID', sql.Int, teamA)
            .input('VisitorTeamID', sql.Int, teamB)
            .input('MatchDate', sql.Date, matchDateIda)
            .input('MatchTime', sql.Time, matchTimeObj)
            .input('Location', sql.VarChar, 'Estadio Local')
            .input('CategoryID', sql.Int, cat.CategoryID)
            .input('LocalPoints', sql.Int, localPointsIda)
            .input('VisitorPoints', sql.Int, visitorPointsIda)
            .input('SeasonID', sql.Int, seasonId)
            .query(`
              INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, CategoryID, LocalPoints, VisitorPoints, SeasonID) 
              VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location, @CategoryID, @LocalPoints, @VisitorPoints, @SeasonID)
            `);
          matchCount++;

          // VUELTA: Team B is Local
          let localPointsVuelta = getRandomNumber(60, 110);
          let visitorPointsVuelta = getRandomNumber(60, 110);
          while (localPointsVuelta === visitorPointsVuelta) visitorPointsVuelta = getRandomNumber(60, 110);

          await pool.request()
            .input('LocalTeamID', sql.Int, teamB)
            .input('VisitorTeamID', sql.Int, teamA)
            .input('MatchDate', sql.Date, matchDateVuelta)
            .input('MatchTime', sql.Time, matchTimeObj)
            .input('Location', sql.VarChar, 'Estadio Local')
            .input('CategoryID', sql.Int, cat.CategoryID)
            .input('LocalPoints', sql.Int, localPointsVuelta)
            .input('VisitorPoints', sql.Int, visitorPointsVuelta)
            .input('SeasonID', sql.Int, seasonId)
            .query(`
              INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, CategoryID, LocalPoints, VisitorPoints, SeasonID) 
              VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location, @CategoryID, @LocalPoints, @VisitorPoints, @SeasonID)
            `);
          matchCount++;
        }
        
        matchDayOffset += 1; // spread matches across different days
      }
    }

    console.log(`Successfully generated ${matchCount} matches (Ida y Vuelta para todas las categorías).`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding matches failed:', err);
    process.exit(1);
  }
}

runSeed();
