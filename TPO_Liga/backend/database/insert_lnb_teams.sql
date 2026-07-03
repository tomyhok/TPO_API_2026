-- Query para insertar los 20 equipos de la Liga Nacional de Básquet (LNB) de Argentina
-- y vincularlos automáticamente a la Temporada que esté Activa en este momento.

DECLARE @SeasonID INT;
SELECT TOP 1 @SeasonID = SeasonID FROM Seasons WHERE IsActive = 1;

IF @SeasonID IS NULL
BEGIN
    PRINT 'Error: No hay una temporada activa. Por favor, ingresa a la aplicación web (Login) y crea una Temporada Activa primero.';
    RETURN;
END

-- Tabla temporal para capturar los IDs generados de los equipos nuevos
CREATE TABLE #InsertedTeams (TeamID INT);

-- Insertar los equipos en la tabla Teams
INSERT INTO Teams (Name, Coach)
OUTPUT inserted.TeamID INTO #InsertedTeams
VALUES 
('Atenas (Córdoba)', 'Gustavo Peirone'),
('Argentino (Junín)', 'Julián Pagura'),
('Boca Juniors', 'Gonzalo Pérez'),
('Ferro Carril Oeste', 'Federico Fernández'),
('Gimnasia (Comodoro Rivadavia)', 'Martín Villagrán'),
('Independiente (Oliva)', 'Martín González'),
('Instituto (Córdoba)', 'Lucas Victoriano'),
('La Unión (Formosa)', 'José Luis Pisani'),
('Oberá Tenis Club', 'Fabio Demti'),
('Obras Sanitarias', 'Diego Vadell'),
('Olímpico (La Banda)', 'Adrián Capelli'),
('Peñarol (Mar del Plata)', 'Hernán Laginestra'),
('Platense', 'Alejandro Vázquez'),
('Quimsa (Santiago del Estero)', 'Leandro Ramella'),
('Regatas (Corrientes)', 'Fernando Calvi'),
('Riachuelo (La Rioja)', 'Sebastián González'),
('San Lorenzo', 'Leonardo Costa'),
('San Martín (Corrientes)', 'Gabriel Revidatti'),
('Unión (Santa Fe)', 'Maximiliano Seigorman'),
('Zárate Basket', 'Manuel Anglese');

-- Vincular los nuevos equipos a la temporada activa en la tabla TeamSeasons
INSERT INTO TeamSeasons (TeamID, SeasonID)
SELECT TeamID, @SeasonID FROM #InsertedTeams;

-- Limpieza
DROP TABLE #InsertedTeams;

PRINT '¡Los 20 equipos de la LNB fueron insertados exitosamente y vinculados a la temporada activa!';
