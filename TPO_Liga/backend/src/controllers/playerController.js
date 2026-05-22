// Importa el modelo Player
const PlayerModel = require('../models/Player');

// Exporta una función controladora para manejar la creación de un nuevo jugador (HTTP POST)
exports.createPlayer = async (req, res) => {
  try {
    // Desestructura los datos necesarios del cuerpo de la solicitud
    const { TeamID, FirstName, LastName, Category } = req.body;
    
    // Valida que se proporcionen todos los campos requeridos
    if (!TeamID || !FirstName || !LastName || !Category) {
      return res.status(400).json({ message: 'TeamID, FirstName, LastName, and Category are required.' });
    }

    // Llama al modelo para crear el jugador
    const player = await PlayerModel.create(TeamID, FirstName, LastName, Category);

    // Devuelve HTTP 201 (Created) con el primer (y único) registro insertado
    res.status(201).json(player);
  } catch (error) {
    // Maneja errores globalmente
    console.error('Error creating player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener todos los jugadores (HTTP GET)
exports.getAllPlayers = async (req, res) => {
  try {
    // Llama al modelo para obtener todos los jugadores
    const players = await PlayerModel.getAll();

    // Devuelve el array de jugadores como JSON
    res.json(players);
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
    
    // Llama al modelo para obtener jugador por ID
    const player = await PlayerModel.getById(id);

    // Si no hay registros coincidentes, devuelve un error 404 Not Found
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Devuelve el objeto de jugador específico encontrado
    res.json(player);
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
    
    // Llama al modelo para obtener jugadores por TeamID
    const players = await PlayerModel.getByTeamId(teamId);

    // Devuelve el array de jugadores para ese equipo
    res.json(players);
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

    // Llama al modelo para actualizar el jugador
    const updatedPlayer = await PlayerModel.update(id, TeamID, FirstName, LastName, Category);

    // Si el recordset está vacío, el ID del jugador no existía
    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Devuelve el registro del jugador actualizado
    res.json(updatedPlayer);
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
    
    // Llama al modelo para eliminar el jugador
    const success = await PlayerModel.delete(id);

    // rowsAffected proporciona el recuento de filas eliminadas; si es 0, no se eliminó nada
    if (!success) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Confirma la eliminación con un mensaje de éxito
    res.json({ message: 'Player deleted successfully.' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
