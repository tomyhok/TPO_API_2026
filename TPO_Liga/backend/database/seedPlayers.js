require('dotenv').config({ path: '../.env' });
const { sql, poolPromise } = require('../src/config/db');

const firstNames = ['Juan', 'Pedro', 'Lucas', 'Matias', 'Diego', 'Martin', 'Nicolas', 'Facundo', 'Tomas', 'Agustin', 'Gonzalo', 'Federico', 'Gaston', 'Maximiliano', 'Pablo', 'Joaquin', 'Ezequiel', 'Emiliano', 'Santiago', 'Rodrigo', 'Leandro', 'Franco', 'Ignacio', 'Gabriel', 'Alejandro', 'Marcos', 'Andres', 'Mariano', 'Bruno', 'Thiago'];
const lastNames = ['Gonzalez', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Perez', 'Garcia', 'Sanchez', 'Romero', 'Sosa', 'Alvarez', 'Torres', 'Ruiz', 'Ramirez', 'Flores', 'Benitez', 'Acosta', 'Medina', 'Herrera', 'Rojas', 'Suarez', 'Molina', 'Ortiz', 'Silva', 'Luna', 'Cabrera', 'Rios', 'Morales'];
const positions = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    console.log(`Active Season ID: ${seasonId}`);

    // Get Teams
    const teamsRes = await pool.request().query('SELECT TeamID FROM Teams');
    const teams = teamsRes.recordset.map(t => t.TeamID);

    // Get Categories
    const catRes = await pool.request().query('SELECT CategoryID, Name FROM Categories');
    const categories = catRes.recordset;

    let playersCreated = 0;

    for (const teamId of teams) {
      for (const cat of categories) {
        console.log(`Seeding 7 players for Team ${teamId} - Category ${cat.Name}`);
        for (let i = 0; i < 7; i++) {
          const fn = getRandomElement(firstNames);
          const ln = getRandomElement(lastNames);
          const jn = getRandomNumber(0, 99);
          const pos = getRandomElement(positions);

          // Insert Player
          const playerRes = await pool.request()
            .input('TeamID', sql.Int, teamId)
            .input('FirstName', sql.NVarChar, fn)
            .input('LastName', sql.NVarChar, ln)
            .input('CategoryID', sql.Int, cat.CategoryID)
            .query(`
              INSERT INTO Players (TeamID, FirstName, LastName, CategoryID) 
              OUTPUT INSERTED.PlayerID
              VALUES (@TeamID, @FirstName, @LastName, @CategoryID)
            `);
          
          const newPlayerId = playerRes.recordset[0].PlayerID;

          // Link to season
          await pool.request()
            .input('PlayerID', sql.Int, newPlayerId)
            .input('SeasonID', sql.Int, seasonId)
            .input('TeamID', sql.Int, teamId)
            .query(`
              INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID)
              VALUES (@PlayerID, @SeasonID, @TeamID)
            `);
            
          playersCreated++;
        }
      }
    }

    console.log(`Successfully created ${playersCreated} players.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
