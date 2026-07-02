const sql = require('mssql');
const { config } = require('dotenv');

config(); // Load variables from .env

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

const POSITIONS = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

async function run() {
  try {
    console.log("Connecting to the database...");
    await sql.connect(dbConfig);
    console.log("Connected.");

    // Get all players
    console.log("Fetching players...");
    const result = await sql.query`
      SELECT p.PlayerID, ps.TeamID, p.CategoryID 
      FROM Players p
      INNER JOIN PlayerSeasons ps ON p.PlayerID = ps.PlayerID
    `;
    const players = result.recordset;
    console.log(`Found ${players.length} players.`);

    // Group by TeamID + CategoryID
    const groups = {};
    for (const player of players) {
      const key = `${player.TeamID}_${player.CategoryID}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(player);
    }

    console.log(`Found ${Object.keys(groups).length} Team+Category groups.`);

    // Assign positions and jersey numbers
    let updateCount = 0;
    
    // We will use a transaction to be safe or just individual updates (individual is fine for ~few hundred players)
    for (const key of Object.keys(groups)) {
      const groupPlayers = groups[key];
      const usedNumbers = new Set();

      // Ensure at least 1 of each position
      let availablePositions = [...POSITIONS];
      
      for (const player of groupPlayers) {
        // Assign Position
        let assignedPosition;
        if (availablePositions.length > 0) {
          // Pop random from available required positions
          const idx = Math.floor(Math.random() * availablePositions.length);
          assignedPosition = availablePositions.splice(idx, 1)[0];
        } else {
          // Pick any random position
          assignedPosition = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        }

        // Assign Jersey Number
        let assignedNumber;
        do {
          assignedNumber = Math.floor(Math.random() * 99) + 1;
        } while (usedNumbers.has(assignedNumber));
        usedNumbers.add(assignedNumber);

        // Update player
        await sql.query`
          UPDATE Players
          SET JerseyNumber = ${assignedNumber}, Position = ${assignedPosition}
          WHERE PlayerID = ${player.PlayerID}
        `;
        
        updateCount++;
        if (updateCount % 100 === 0) {
          console.log(`Updated ${updateCount} players...`);
        }
      }
    }

    console.log(`Successfully updated ${updateCount} players!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.close();
  }
}

run();
