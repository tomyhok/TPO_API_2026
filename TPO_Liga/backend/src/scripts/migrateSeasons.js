const { sql, poolPromise } = require('../config/db');

async function runMigration() {
  try {
    const pool = await poolPromise;
    console.log("Starting Migration...");

    // 1. Create Seasons table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Seasons' AND xtype='U')
      BEGIN
          CREATE TABLE [dbo].[Seasons](
              [SeasonID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
              [Name] [varchar](100) NOT NULL,
              [StartDate] [date] NULL,
              [EndDate] [date] NULL,
              [IsActive] [bit] NOT NULL DEFAULT 0,
              [CreatedAt] [datetime] DEFAULT GETDATE()
          )
          -- Insert a default season
          INSERT INTO Seasons (Name, IsActive) VALUES ('Apertura 2026', 1);
      END
    `);
    console.log("Seasons table checked/created.");

    // 2. Create TeamSeasons
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TeamSeasons' AND xtype='U')
      BEGIN
          CREATE TABLE [dbo].[TeamSeasons](
              [TeamSeasonID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
              [TeamID] [int] NOT NULL FOREIGN KEY REFERENCES Teams(TeamID),
              [SeasonID] [int] NOT NULL FOREIGN KEY REFERENCES Seasons(SeasonID),
              UNIQUE(TeamID, SeasonID)
          )
          -- Assign all existing teams to Season 1
          INSERT INTO TeamSeasons (TeamID, SeasonID)
          SELECT TeamID, 1 FROM Teams;
      END
    `);
    console.log("TeamSeasons table checked/created.");

    // 3. Create PlayerSeasons
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PlayerSeasons' AND xtype='U')
      BEGIN
          CREATE TABLE [dbo].[PlayerSeasons](
              [PlayerSeasonID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
              [PlayerID] [int] NOT NULL FOREIGN KEY REFERENCES Players(PlayerID),
              [SeasonID] [int] NOT NULL FOREIGN KEY REFERENCES Seasons(SeasonID),
              [TeamID] [int] NULL FOREIGN KEY REFERENCES Teams(TeamID),
              UNIQUE(PlayerID, SeasonID)
          )
          -- Assign all existing players to Season 1, with their current TeamID
          INSERT INTO PlayerSeasons (PlayerID, SeasonID, TeamID)
          SELECT PlayerID, 1, TeamID FROM Players;
      END
    `);
    console.log("PlayerSeasons table checked/created.");

    // 4. Alter Matches table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Matches') AND name = 'SeasonID')
      BEGIN
          ALTER TABLE [dbo].[Matches] ADD [SeasonID] [int] NULL FOREIGN KEY REFERENCES Seasons(SeasonID);
          
          -- Assuming existing matches belong to Season 1
          EXEC('UPDATE [dbo].[Matches] SET SeasonID = 1 WHERE SeasonID IS NULL');
          
          -- Make it not null after populating
          ALTER TABLE [dbo].[Matches] ALTER COLUMN [SeasonID] [int] NOT NULL;
      END
    `);
    console.log("Matches table altered.");

    // 5. Update v_Standings View
    await pool.request().query(`
      ALTER VIEW [dbo].[v_Standings] AS
      WITH MatchStats AS (
          SELECT 
              SeasonID,
              LocalTeamID AS TeamID,
              1 AS Played,
              CASE WHEN LocalPoints > VisitorPoints THEN 3 WHEN LocalPoints = VisitorPoints THEN 1 ELSE 0 END AS Points,
              CASE WHEN LocalPoints > VisitorPoints THEN 1 ELSE 0 END AS Won,
              CASE WHEN LocalPoints = VisitorPoints THEN 1 ELSE 0 END AS Tied,
              CASE WHEN LocalPoints < VisitorPoints THEN 1 ELSE 0 END AS Lost,
              LocalPoints AS PointsFor,
              VisitorPoints AS PointsAgainst
          FROM Matches WHERE LocalPoints IS NOT NULL AND VisitorPoints IS NOT NULL
          
          UNION ALL
          
          SELECT 
              SeasonID,
              VisitorTeamID AS TeamID,
              1 AS Played,
              CASE WHEN VisitorPoints > LocalPoints THEN 3 WHEN VisitorPoints = LocalPoints THEN 1 ELSE 0 END AS Points,
              CASE WHEN VisitorPoints > LocalPoints THEN 1 ELSE 0 END AS Won,
              CASE WHEN VisitorPoints = LocalPoints THEN 1 ELSE 0 END AS Tied,
              CASE WHEN VisitorPoints < LocalPoints THEN 1 ELSE 0 END AS Lost,
              VisitorPoints AS PointsFor,
              LocalPoints AS PointsAgainst
          FROM Matches WHERE LocalPoints IS NOT NULL AND VisitorPoints IS NOT NULL
      )
      SELECT 
          ts.SeasonID,
          t.TeamID,
          t.Name AS Equipo,
          t.LogoURL,
          ISNULL(SUM(m.Points), 0) AS Puntos,
          ISNULL(SUM(m.Played), 0) AS PartidosJugados,
          ISNULL(SUM(m.Won), 0) AS PartidosGanados,
          ISNULL(SUM(m.Tied), 0) AS PartidosEmpatados,
          ISNULL(SUM(m.Lost), 0) AS PartidosPerdidos,
          ISNULL(SUM(m.PointsFor), 0) AS TantosAFavor,
          ISNULL(SUM(m.PointsAgainst), 0) AS TantosEnContra,
          ISNULL(SUM(m.PointsFor) - SUM(m.PointsAgainst), 0) AS DiferenciaDeTantos
      FROM TeamSeasons ts
      JOIN Teams t ON ts.TeamID = t.TeamID
      LEFT JOIN MatchStats m ON ts.TeamID = m.TeamID AND ts.SeasonID = m.SeasonID
      GROUP BY ts.SeasonID, t.TeamID, t.Name;
    `);
    console.log("v_Standings view updated.");

    // 6. Modify Players table to make TeamID nullable if it's not already (since TeamID is moved to PlayerSeasons)
    await pool.request().query(`
      ALTER TABLE [dbo].[Players] ALTER COLUMN [TeamID] [int] NULL;
    `);

    console.log("Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
