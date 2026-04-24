// Importa el objeto sql y la promesa del pool de conexiones de la configuración de BD
const { sql, poolPromise } = require('../config/db');

// Exporta una función controladora para manejar la creación de un nuevo jugador (HTTP POST)
exports.createPlayer = async (req, res) => {
  try {
    // Desestructura los datos necesarios del cuerpo de la solicitud
    const { TeamID, FirstName, LastName, Category } = req.body;
    
    // Valida que se proporcionen todos los campos requeridos
    if (!TeamID || !FirstName || !LastName || !Category) {
      return res.status(400).json({ message: 'TeamID, FirstName, LastName, and Category are required.' });
    }

    // Espera el pool de conexiones de BD
    const pool = await poolPromise;
    // Crea una nueva solicitud SQL y vincula parámetros para prevenir inyección SQL
    const result = await pool.request()
      .input('TeamID', sql.Int, TeamID) // Vincula TeamID como Entero
      .input('FirstName', sql.NVarChar, FirstName) // Vincula FirstName como cadena
      .input('LastName', sql.NVarChar, LastName) // Vincula LastName como cadena
      .input('Category', sql.NVarChar, Category) // Vincula Category como cadena
      // Ejecuta la consulta INSERT. OUTPUT INSERTED.* asegura que se devuelva el registro recién creado
      .query('INSERT INTO Players (TeamID, FirstName, LastName, Category) OUTPUT INSERTED.* VALUES (@TeamID, @FirstName, @LastName, @Category)');

    // Devuelve HTTP 201 (Created) con el primer (y único) registro insertado
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    // Maneja errores globalmente
    console.error('Error creating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener todos los jugadores (HTTP GET)
exports.getAllPlayers = async (req, res) => {
  try {
    const pool = await poolPromise;
    // Ejecuta una consulta SELECT básica
    const result = await pool.request()
      .query('SELECT * FROM Players');

    // Devuelve el array de jugadores como JSON
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener un jugador específico por ID (HTTP GET)
exports.getPlayerById = async (req, res) => {
  try {
    // Extrae el ID del jugador de los parámetros de URL
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Vincula el parámetro ID y consulta la BD
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('SELECT * FROM Players WHERE PlayerID = @PlayerID');

    // Si no hay registros coincidentes, devuelve un error 404 Not Found
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Devuelve el objeto de jugador específico encontrado
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener todos los jugadores pertenecientes a un equipo específico (HTTP GET)
exports.getPlayersByTeamId = async (req, res) => {
  try {
    // Extrae el ID del equipo de los parámetros de la URL
    const { teamId } = req.params;
    const pool = await poolPromise;
    
    // Vincula el parámetro ID del equipo y selecciona todos los jugadores asociados con él
    const result = await pool.request()
      .input('TeamID', sql.Int, teamId)
      .query('SELECT * FROM Players WHERE TeamID = @TeamID');

    // Devuelve el array de jugadores para ese equipo
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching players by team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para actualizar los detalles del jugador (HTTP PUT/PATCH)
exports.updatePlayer = async (req, res) => {
  try {
    // Extrae el ID del jugador de los parámetros de URL
    const { id } = req.params;
    // Desestructura posibles campos de actualización del cuerpo
    const { TeamID, FirstName, LastName, Category } = req.body;
    
    // Comprueba si se proporciona al menos un campo
    if (!TeamID && !FirstName && !LastName && !Category) {
      return res.status(400).json({ message: 'At least one field must be provided for update.' });
    }

    const pool = await poolPromise;
    // Inicializa la solicitud y vincula el PlayerID objetivo
    const request = pool.request().input('PlayerID', sql.Int, id);
    
    // Inicializa un array para rastrear qué campos necesitan actualizarse dinámicamente
    let updates = [];
    
    // Vincula parámetros condicionalmente y construye las cláusulas SET
    if (TeamID) {
      request.input('TeamID', sql.Int, TeamID);
      updates.push('TeamID = @TeamID');
    }
    if (FirstName) {
      request.input('FirstName', sql.NVarChar, FirstName);
      updates.push('FirstName = @FirstName');
    }
    if (LastName) {
      request.input('LastName', sql.NVarChar, LastName);
      updates.push('LastName = @LastName');
    }
    if (Category) {
      request.input('Category', sql.NVarChar, Category);
      updates.push('Category = @Category');
    }
    
    // Construye la consulta UPDATE dinámica, emitiendo la fila modificada
    const query = `UPDATE Players SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE PlayerID = @PlayerID`;
    const result = await request.query(query);

    // Si el recordset está vacío, el ID del jugador no existía
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Devuelve el registro del jugador actualizado
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para eliminar un jugador (HTTP DELETE)
exports.deletePlayer = async (req, res) => {
  try {
    // Extrae el ID del jugador de los parámetros de la URL
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Ejecuta la consulta DELETE mapeada al PlayerID específico
    const result = await pool.request()
      .input('PlayerID', sql.Int, id)
      .query('DELETE FROM Players WHERE PlayerID = @PlayerID');

    // rowsAffected proporciona el recuento de filas eliminadas; si es 0, no se eliminó nada
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Confirma la eliminación con un mensaje de éxito
    res.json({ message: 'Player deleted successfully.' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
