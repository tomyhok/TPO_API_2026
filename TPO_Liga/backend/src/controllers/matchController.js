// Importa el objeto 'sql' (para definir tipos de parámetros) y 'poolPromise' (para establecer la conexión a la BD) del archivo de configuración
const { sql, poolPromise } = require('../config/db');

// Exporta una función controladora para manejar la creación de un nuevo partido (Solicitud HTTP POST)
exports.createMatch = async (req, res) => {
  try {
    // Desestructura los detalles requeridos del partido del cuerpo de la solicitud entrante
    const { LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location } = req.body;
    
    // Valida que todos los campos requeridos hayan sido proporcionados por el cliente
    if (!LocalTeamID || !VisitorTeamID || !MatchDate || !MatchTime || !Location) {
      // Si falta algún campo, devuelve un código de estado 400 Bad Request y un mensaje de error
      return res.status(400).json({ message: 'LocalTeamID, VisitorTeamID, MatchDate, MatchTime, and Location are required.' });
    }

    // Asegura que un equipo no esté jugando contra sí mismo
    if (LocalTeamID === VisitorTeamID) {
      return res.status(400).json({ message: 'LocalTeamID and VisitorTeamID cannot be the same.' });
    }

    // Espera el pool de conexiones de SQL Server para asegurar que esté listo
    const pool = await poolPromise;
    
    // Crea un nuevo objeto de solicitud y configura parámetros SQL para prevenir inyección SQL
    const result = await pool.request()
      .input('LocalTeamID', sql.Int, LocalTeamID) // Vincula LocalTeamID como un entero
      .input('VisitorTeamID', sql.Int, VisitorTeamID) // Vincula VisitorTeamID como un entero
      .input('MatchDate', sql.Date, MatchDate) // Vincula MatchDate como una fecha
      .input('MatchTime', sql.Time, MatchTime) // Vincula MatchTime como un tiempo
      .input('Location', sql.NVarChar, Location) // Vincula Location como una cadena (NVarChar)
      // Ejecuta la consulta INSERT y usa OUTPUT INSERTED.* para devolver la fila recién creada
      .query('INSERT INTO Matches (LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location) OUTPUT INSERTED.* VALUES (@LocalTeamID, @VisitorTeamID, @MatchDate, @MatchTime, @Location)');

    // Devuelve un código de estado HTTP 201 Created junto con los datos del partido recién creado (el primer y único elemento en el recordset)
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    // Registra cualquier error que ocurra durante el proceso y envía una respuesta genérica 500 Internal Server Error
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la obtención de todos los partidos (Solicitud HTTP GET)
exports.getAllMatches = async (req, res) => {
  try {
    // Obtiene el pool de conexiones a la base de datos
    const pool = await poolPromise;
    // Ejecuta una simple consulta SELECT para recuperar todas las filas de la tabla Matches
    const result = await pool.request()
      .query('SELECT * FROM Matches');

    // Devuelve el array de todos los partidos directamente al cliente como JSON
    res.json(result.recordset);
  } catch (error) {
    // Maneja posibles errores con registro (logging) y una respuesta 500
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la obtención de un solo partido por su ID (Solicitud HTTP GET)
exports.getMatchById = async (req, res) => {
  try {
    // Extrae el ID del partido de los parámetros de ruta de la URL
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Crea un parámetro de consulta para el ID del partido para prevenir inyección SQL
    const result = await pool.request()
      .input('MatchID', sql.Int, id) // Vincula el parámetro ID como un entero
      // Selecciona el partido donde el MatchID coincide con el parámetro proporcionado
      .query('SELECT * FROM Matches WHERE MatchID = @MatchID');

    // Si la consulta no devolvió ninguna fila, significa que no se encontró el partido
    if (result.recordset.length === 0) {
      // Devuelve un código de estado 404 Not Found
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve la primera (y única) fila del conjunto de resultados, que es el partido solicitado
    res.json(result.recordset[0]);
  } catch (error) {
    // Maneja errores (ej., base de datos no disponible)
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para actualizar los detalles de un partido existente (Solicitud HTTP PUT/PATCH)
exports.updateMatchDetails = async (req, res) => {
  try {
    // Extrae el ID del partido de los parámetros de la URL
    const { id } = req.params;
    // Extrae los campos de actualización permitidos del cuerpo de la solicitud
    const { MatchDate, MatchTime, Location } = req.body;
    
    // Valida que se proporcione al menos un campo para la actualización
    if (!MatchDate && !MatchTime && !Location) {
      return res.status(400).json({ message: 'At least one field (MatchDate, MatchTime, or Location) must be provided for update.' });
    }

    // Obtiene el pool de conexiones a la base de datos
    const pool = await poolPromise;
    // Inicializa la solicitud y vincula el parámetro obligatorio MatchID
    const request = pool.request().input('MatchID', sql.Int, id);
    
    // Inicializa un array para contener dinámicamente las cláusulas SET
    let updates = [];
    
    // Agrega condicionalmente campos a la consulta de actualización y vincula los parámetros respectivos
    if (MatchDate) {
      request.input('MatchDate', sql.Date, MatchDate);
      updates.push('MatchDate = @MatchDate'); // Agrega al array de cadenas SET
    }
    if (MatchTime) {
      request.input('MatchTime', sql.Time, MatchTime);
      updates.push('MatchTime = @MatchTime');
    }
    if (Location) {
      request.input('Location', sql.NVarChar, Location);
      updates.push('Location = @Location');
    }
    
    // Construye la consulta UPDATE final uniendo el array 'updates' con comas
    // OUTPUT INSERTED.* devuelve la fila completa actualizada
    const query = `UPDATE Matches SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE MatchID = @MatchID`;
    // Ejecuta la consulta construida
    const result = await request.query(query);

    // Si no se devolvieron filas, la actualización falló porque el ID no existe
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve los datos del partido actualizados
    res.json(result.recordset[0]);
  } catch (error) {
    // Maneja los errores con elegancia
    console.error('Error updating match details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para actualizar el puntaje de un partido
exports.updateMatchScore = async (req, res) => {
  try {
    // Extrae el ID del partido de los parámetros de la URL
    const { id } = req.params;
    // Extrae los puntos de los equipos local y visitante del cuerpo de la solicitud
    const { LocalPoints, VisitorPoints } = req.body;
    
    // Verifica estrictamente contra undefined para asegurar que se permitan 0 puntos
    if (LocalPoints === undefined || VisitorPoints === undefined) {
      return res.status(400).json({ message: 'Both LocalPoints and VisitorPoints must be provided.' });
    }

    // Configura la conexión a la base de datos y la vinculación de parámetros
    const pool = await poolPromise;
    const request = pool.request()
      .input('MatchID', sql.Int, id) // Vincula el parámetro MatchID
      .input('LocalPoints', sql.Int, LocalPoints) // Vincula LocalPoints
      .input('VisitorPoints', sql.Int, VisitorPoints); // Vincula VisitorPoints
      
    // Ejecuta la consulta UPDATE apuntando específicamente a las columnas de puntos
    // Genera la fila completamente actualizada a través de OUTPUT INSERTED.*
    const query = `UPDATE Matches SET LocalPoints = @LocalPoints, VisitorPoints = @VisitorPoints OUTPUT INSERTED.* WHERE MatchID = @MatchID`;
    const result = await request.query(query);

    // Verifica si se encontró y actualizó exitosamente un partido
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve los datos del partido actualizados al cliente
    res.json(result.recordset[0]);
  } catch (error) {
    // Manejo estándar de errores
    console.error('Error updating match score:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la eliminación de un partido (Solicitud HTTP DELETE)
exports.deleteMatch = async (req, res) => {
  try {
    // Extrae el ID del partido de los parámetros de la URL
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Ejecuta una consulta SQL DELETE vinculada con el ID del partido proporcionado
    const result = await pool.request()
      .input('MatchID', sql.Int, id) // Vincula el parámetro de forma segura
      .query('DELETE FROM Matches WHERE MatchID = @MatchID');

    // Usa rowsAffected para determinar si ocurrió la eliminación
    // Si rowsAffected[0] es 0, no existía ningún partido con ese ID
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve un mensaje de éxito genérico tras una eliminación exitosa
    res.json({ message: 'Match deleted successfully.' });
  } catch (error) {
    // Atrapa y registra errores del servidor o de la base de datos
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
