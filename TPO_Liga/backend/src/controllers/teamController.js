// Importa el objeto sql y la promesa del pool de conexiones desde la configuración de BD
const { sql, poolPromise } = require('../config/db');

// Exporta una función controladora para manejar la creación de un nuevo equipo (HTTP POST)
exports.createTeam = async (req, res) => {
  try {
    // Desestructura Nombre y Entrenador del cuerpo de la solicitud entrante
    const { Name, Coach } = req.body;
    // Validación básica para asegurar que se proporcionen todos los campos necesarios
    if (!Name || !Coach) {
      return res.status(400).json({ message: 'Name and Coach are required.' });
    }

    // Conecta al pool de base de datos
    const pool = await poolPromise;
    // Ejecuta una consulta INSERT, pasando parámetros de forma segura
    const result = await pool.request()
      .input('Name', sql.NVarChar, Name) // Vincula el parámetro Name del equipo
      .input('Coach', sql.NVarChar, Coach) // Vincula el parámetro Coach del equipo
      // OUTPUT INSERTED.* devuelve el registro completo del equipo recién creado
      .query('INSERT INTO Teams (Name, Coach) OUTPUT INSERTED.* VALUES (@Name, @Coach)');

    // Devuelve el objeto de equipo creado con estado 201 Created
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la obtención de todos los equipos (HTTP GET)
exports.getAllTeams = async (req, res) => {
  try {
    const pool = await poolPromise;
    // Ejecuta una consulta SELECT simple para obtener todos los registros de Teams
    const result = await pool.request()
      .query('SELECT * FROM Teams');

    // Devuelve el array de registros de equipos recuperado
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener el detalle completo de un equipo (HTTP GET)
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // 1. Obtener información básica del equipo
    const teamResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Teams WHERE TeamID = @TeamID');

    if (teamResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    const team = teamResult.recordset[0];

    // 2. Obtener lista de jugadores del equipo
    const playersResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Players WHERE TeamID = @TeamID');
    team.Players = playersResult.recordset;

    // 3. Obtener partidos asociados al equipo
    const matchesResult = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('SELECT * FROM Matches WHERE LocalTeamID = @TeamID OR VisitorTeamID = @TeamID ORDER BY MatchDate DESC');
    
    const allMatches = matchesResult.recordset;
    
    // Clasificar partidos en jugados (tienen resultado) y pendientes (no tienen resultado)
    team.PlayedMatches = allMatches.filter(m => m.LocalPoints !== null && m.VisitorPoints !== null);
    team.PendingMatches = allMatches.filter(m => m.LocalPoints === null || m.VisitorPoints === null);
    
    // Resultados obtenidos
    team.Results = team.PlayedMatches;

    // Devuelve el objeto del equipo con todos sus detalles anidados
    res.json(team);
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para actualizar un equipo existente (HTTP PUT/PATCH)
exports.updateTeam = async (req, res) => {
  try {
    // Extrae ID de los parámetros y campos del cuerpo
    const { id } = req.params;
    const { Name, Coach } = req.body;
    
    // Valida que realmente haya datos para actualizar
    if (!Name && !Coach) {
      return res.status(400).json({ message: 'At least Name or Coach must be provided for update.' });
    }

    const pool = await poolPromise;
    // Crea la solicitud de BD y vincula el ID de Equipo objetivo
    const request = pool.request().input('TeamID', sql.Int, id);
    
    // Inicializa un array para almacenar cláusulas SET dinámicas
    let updates = [];
    
    // Comprueba condicionalmente si se enviaron campos, vincula sus parámetros y los añade al array updates
    if (Name) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (Coach) {
      request.input('Coach', sql.NVarChar, Coach);
      updates.push('Coach = @Coach');
    }
    
    // Une el array updates en una cadena separada por comas para construir la consulta final
    const query = `UPDATE Teams SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE TeamID = @TeamID`;
    const result = await request.query(query);

    // Si no se modificó ninguna fila, es probable que el ID de equipo especificado no existiera
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Devuelve los datos del equipo actualizados con éxito
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para eliminar un equipo específico (HTTP DELETE)
exports.deleteTeam = async (req, res) => {
  try {
    // Extrae el ID del equipo de la URL
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Ejecuta una consulta DELETE usando el parámetro vinculado
    const result = await pool.request()
      .input('TeamID', sql.Int, id)
      .query('DELETE FROM Teams WHERE TeamID = @TeamID');

    // Comprueba rowsAffected para confirmar que la eliminación tuvo éxito
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Devuelve un mensaje de éxito genérico
    res.json({ message: 'Team deleted successfully.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    // 547 es el código de error de SQL Server para violaciones de clave foránea (Foreign Key)
    if (error.number === 547) {
      return res.status(400).json({ message: 'Cannot delete team because it has associated players or matches.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};
