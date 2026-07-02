-- Añadir columna IsFinished a Seasons si no existe
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID(N'[dbo].[Seasons]') AND name = 'IsFinished'
)
BEGIN
    ALTER TABLE [dbo].[Seasons] ADD IsFinished BIT NOT NULL DEFAULT 0;
END
GO

-- Crear tabla TeamChampionships
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TeamChampionships]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TeamChampionships] (
        ChampionshipID INT IDENTITY(1,1) PRIMARY KEY,
        TeamID INT NOT NULL,
        SeasonID INT NOT NULL,
        CategoryName NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (TeamID) REFERENCES [dbo].[Teams](TeamID),
        FOREIGN KEY (SeasonID) REFERENCES [dbo].[Seasons](SeasonID)
    );
END
GO
