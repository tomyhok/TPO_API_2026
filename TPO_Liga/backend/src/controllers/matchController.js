// Importa el modelo Match
const MatchModel = require('../models/Match');

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

    // Llama al modelo para crear el partido
    const match = await MatchModel.create(LocalTeamID, VisitorTeamID, MatchDate, MatchTime, Location);

    // Devuelve un código de estado HTTP 201 Created junto con los datos del partido recién creado
    res.status(201).json(match);
  } catch (error) {
    // Registra cualquier error que ocurra durante el proceso y envía una respuesta genérica 500 Internal Server Error
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la obtención de todos los partidos (Solicitud HTTP GET)
exports.getAllMatches = async (req, res) => {
  try {
    // Llama al modelo para obtener todos los partidos
    const matches = await MatchModel.getAll();

    // Devuelve el array de todos los partidos directamente al cliente como JSON
    res.json(matches);
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
    
    // Llama al modelo para obtener el partido por ID
    const match = await MatchModel.getById(id);

    // Si la consulta no devolvió ninguna fila, significa que no se encontró el partido
    if (!match) {
      // Devuelve un código de estado 404 Not Found
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve el partido solicitado
    res.json(match);
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

    // Llama al modelo para actualizar detalles
    const updatedMatch = await MatchModel.updateDetails(id, MatchDate, MatchTime, Location);

    // Si no se devolvieron filas, la actualización falló porque el ID no existe
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve los datos del partido actualizados
    res.json(updatedMatch);
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

    // Llama al modelo para actualizar puntajes
    const updatedMatch = await MatchModel.updateScore(id, LocalPoints, VisitorPoints);

    // Verifica si se encontró y actualizó exitosamente un partido
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Devuelve los datos del partido actualizados al cliente
    res.json(updatedMatch);
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
    
    // Llama al modelo para eliminar el partido
    const success = await MatchModel.delete(id);

    // Si success es falso, no existía ningún partido con ese ID
    if (!success) {
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
