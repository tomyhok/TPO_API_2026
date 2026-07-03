const { sql, poolPromise } = require('../config/db');

async function seedDatabase() {
  try {
    const pool = await poolPromise;
    console.log("Limpiando base de datos...");
    await pool.request().query(`
      DELETE FROM Matches;
      DELETE FROM PlayerSeasons;
      DELETE FROM Players;
      DELETE FROM TeamSeasons;
      DELETE FROM Teams;
      DELETE FROM Seasons;
      DBCC CHECKIDENT ('Matches', RESEED, 0);
      DBCC CHECKIDENT ('Players', RESEED, 0);
      DBCC CHECKIDENT ('Teams', RESEED, 0);
      DBCC CHECKIDENT ('Seasons', RESEED, 0);
    `);
    
    console.log("Iniciando la carga de datos de la Liga Nacional de Básquet...");

    // 1. Crear Temporadas
    const seasonsData = [
      { Name: "Liga Nacional 2024/2025", StartDate: "2024-10-01", EndDate: "2025-06-15", IsActive: 0 },
      { Name: "Torneo Super 20 - 2025", StartDate: "2025-08-01", EndDate: "2025-09-30", IsActive: 0 },
      { Name: "Liga Nacional 2025/2026", StartDate: "2025-10-01", EndDate: "2026-06-15", IsActive: 1 }
    ];

    const seasonIds = [];
    for (const s of seasonsData) {
      const res = await pool.request()
        .input('Name', sql.NVarChar, s.Name)
        .input('StartDate', sql.Date, s.StartDate)
        .input('EndDate', sql.Date, s.EndDate)
        .input('IsActive', sql.Bit, s.IsActive)
        .query('INSERT INTO Seasons (Name, StartDate, EndDate, IsActive) OUTPUT INSERTED.SeasonID VALUES (@Name, @StartDate, @EndDate, @IsActive)');
      seasonIds.push(res.recordset[0].SeasonID);
    }
    console.log(`✅ ${seasonsData.length} Temporadas creadas.`);

    // 2. Crear Equipos
    const teamsData = [
      { Name: "Boca Juniors", Coach: "Carlos Duro" },
      { Name: "Quimsa (SdE)", Coach: "Leandro Ramella" },
      { Name: "Instituto (Cba)", Coach: "Lucas Victoriano" },
      { Name: "San Lorenzo", Coach: "Leonardo Costa" },
      { Name: "Obras Basket", Coach: "Diego Vadell" },
      { Name: "Olímpico (La Banda)", Coach: "Leonardo Gutiérrez" },
      { Name: "Regatas Corrientes", Coach: "Fernando Calvi" },
      { Name: "Peñarol (MdP)", Coach: "Hernán Laginestra" },
      { Name: "Gimnasia (CR)", Coach: "Martín Villagrán" },
      { Name: "Ferro Carril Oeste", Coach: "Federico Fernández" }
    ];

    const teams = [];
    for (const t of teamsData) {
      const res = await pool.request()
        .input('Name', sql.NVarChar, t.Name)
        .input('Coach', sql.NVarChar, t.Coach)
        .query('INSERT INTO Teams (Name, Coach) OUTPUT INSERTED.TeamID, INSERTED.Name VALUES (@Name, @Coach)');
      
      const newTeam = res.recordset[0];
      teams.push(newTeam);

      // Asignar el equipo a todas las temporadas
      for (const sId of seasonIds) {
        await pool.request()
          .input('TeamID', sql.Int, newTeam.TeamID)
          .input('SeasonID', sql.Int, sId)
          .query('INSERT INTO TeamSeasons (TeamID, SeasonID) VALUES (@TeamID, @SeasonID)');
      }
    }
    console.log(`✅ ${teamsData.length} Equipos creados y asignados a temporadas.`);

    // 3. Crear Jugadores
    const playerFirstNames = ["Facundo", "Nicolás", "Luca", "Leandro", "Marcos", "Juan", "Federico", "Agustín", "Franco", "Tomás", "Santiago", "Matías", "Ignacio", "Luciano", "Kevin"];
    const playerLastNames = ["Campazzo", "Laprovittola", "Vildoza", "Bolmaro", "Delía", "Brussino", "Garino", "Fjellerup", "Gallizzi", "Redivo", "Caffaro", "Romano", "Mainoldi", "Baralle", "Ramírez"];
    const positions = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

    let playersCreated = 0;
    for (const t of teams) {
      // Create 8 players per team
      for (let i = 0; i < 8; i++) {
        const fName = playerFirstNames[Math.floor(Math.random() * playerFirstNames.length)];
        const lName = playerLastNames[Math.floor(Math.random() * playerLastNames.length)];
        const position = positions[i % positions.length];
        const number = Math.floor(Math.random() * 99) + 1;

        const res = await pool.request()
          .input('TeamID', sql.Int, t.TeamID)
          .input('FirstName', sql.NVarChar, fName)
          .input('LastName', sql.NVarChar, lName)
          .input('Category', sql.NVarChar, position)
          .query('INSERT INTO Players (TeamID, FirstName, LastName, Category) OUTPUT INSERTED.PlayerID VALUES (@TeamID, @FirstName, @LastName, @Category)');
        
        const pId = res.recordset[0].PlayerID;
        
        // Asignar jugador a las temporadas
        for (const sId of seasonIds) {
          await pool.request()
            .input('PlayerID', sql.Int, pId)
            .input('SeasonID', sql.Int, sId)
            .input('TeamID', sql.Int, t.TeamID)
            .query('INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID) VALUES (@PlayerID, @SeasonID, @TeamID)');
        }
        playersCreated++;
      }
    }
    console.log(`✅ ${playersCreated} Jugadores creados y asignados a temporadas.`);

    // 4. Crear Partidos
    let matchesCreated = 0;
    for (const sId of seasonIds) {
      // Round robin para cada temporada (todos contra todos, ida y vuelta)
      for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
          if (i !== j) {
            // Un partido
            const local = teams[i];
            const visitor = teams[j];
            
            const isPlayed = Math.random() > 0.3; // 70% de partidos ya jugados
            const localPoints = isPlayed ? Math.floor(Math.random() * 40) + 65 : null;
            const visitorPoints = isPlayed ? Math.floor(Math.random() * 40) + 65 : null;
            
            // Random date based on season
            const dateOffset = Math.floor(Math.random() * 180); // Up to 6 months
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() - dateOffset);
            
            await pool.request()
              .input('LocalTeamID', sql.Int, local.TeamID)
              .input('VisitorTeamID', sql.Int, visitor.TeamID)
              .input('MatchDate', sql.Date, baseDate)
              .input('MatchTime', sql.Time, "21:00:00")
              .input('Location', sql.NVarChar, `Estadio de ${local.Name}`)
              .input('SeasonID', sql.Int, sId)
              .input('LocalPoints', sql.Int, localPoints)
              .input('VisitorPoints', sql.Int, visitorPoints)
              .query(`
                INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location, SeasonID, LocalPoints, VisitorPoints) 
                VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location, @SeasonID, @LocalPoints, @VisitorPoints)
              `);
            matchesCreated++;
          }
        }
      }
    }
    console.log(`✅ ${matchesCreated} Partidos creados (jugados y pendientes).`);

    console.log("🎉 Seed finalizado exitosamente.");
    process.exit(0);

  } catch (err) {
    console.error("Error en el seed:", err);
    process.exit(1);
  }
}

seedDatabase();
