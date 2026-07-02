const { poolPromise } = require('./src/config/db');

async function updateView() {
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      ALTER VIEW [dbo].[v_Standings] AS
      WITH MatchStats AS (
          SELECT 
              SeasonID,
              LocalTeamID AS TeamID,
              CategoryID,
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
              CategoryID,
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
          c.CategoryID,
          c.Name AS CategoryName,
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
      CROSS JOIN Categories c
      LEFT JOIN MatchStats m ON ts.TeamID = m.TeamID AND ts.SeasonID = m.SeasonID AND c.CategoryID = m.CategoryID
      GROUP BY ts.SeasonID, t.TeamID, t.Name, t.LogoURL, c.CategoryID, c.Name;
    `);
    console.log("View updated successfully");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

updateView();
