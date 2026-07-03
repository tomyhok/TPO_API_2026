USE YouthBasketballLeague;
GO

-- 1. Create Categories table
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(50) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Insert default categories
INSERT INTO Categories (Name) VALUES ('Mayores'), ('Sub-18'), ('Sub-15'), ('Sub-13');
GO

-- 2. Modify Matches table
ALTER TABLE Matches ADD CategoryID INT;
GO
UPDATE Matches SET CategoryID = 1 WHERE CategoryID IS NULL;
GO
ALTER TABLE Matches ALTER COLUMN CategoryID INT NOT NULL;
GO
ALTER TABLE Matches ADD CONSTRAINT FK_Matches_Category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID);
GO

-- 3. Modify Players table
ALTER TABLE Players DROP COLUMN Category;
GO
ALTER TABLE Players ADD CategoryID INT;
GO
UPDATE Players SET CategoryID = 1 WHERE CategoryID IS NULL;
GO
ALTER TABLE Players ALTER COLUMN CategoryID INT NOT NULL;
GO
ALTER TABLE Players ADD CONSTRAINT FK_Players_Category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID);
GO

-- 4. Update v_Standings view
DROP VIEW v_Standings;
GO
CREATE VIEW [dbo].[v_Standings] AS
WITH MatchStats AS (
    SELECT 
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
FROM Teams t
CROSS JOIN Categories c
LEFT JOIN MatchStats m ON t.TeamID = m.TeamID AND c.CategoryID = m.CategoryID
GROUP BY t.TeamID, t.Name, c.CategoryID, c.Name;
GO
