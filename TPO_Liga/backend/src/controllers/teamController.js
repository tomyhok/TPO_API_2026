// Importa el modelo de Team
const TeamModel = require('../models/Team');

// Exporta una función controladora para manejar la creación de un nuevo equipo (HTTP POST)
exports.createTeam = async (req, res) => {
  try {
    // Desestructura Nombre y Entrenador del cuerpo de la solicitud entrante
    const { Name, Coach } = req.body;
    // Validación básica para asegurar que se proporcionen todos los campos necesarios
    if (!Name || !Coach) {
      return res.status(400).json({ message: 'Name and Coach are required.' });
    }

    // Llama al modelo para crear el equipo
    const team = await TeamModel.create(Name, Coach);

    // Devuelve el objeto de equipo creado con estado 201 Created
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para manejar la obtención de todos los equipos (HTTP GET)
exports.getAllTeams = async (req, res) => {
  try {
    // Llama al modelo para obtener todos los equipos
    const teams = await TeamModel.getAll();

    // Devuelve el array de registros de equipos recuperado
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Exporta una función controladora para obtener el detalle completo de un equipo (HTTP GET)
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Llama al modelo para obtener el equipo por ID
    const team = await TeamModel.getById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

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

    // Llama al modelo para actualizar el equipo
    const updatedTeam = await TeamModel.update(id, Name, Coach);

    // Si el modelo retorna null, el equipo no existe
    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Devuelve los datos del equipo actualizados con éxito
    res.json(updatedTeam);
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
    
    // Llama al modelo para eliminar el equipo
    const success = await TeamModel.delete(id);

    // Comprueba si se eliminó con éxito
    if (!success) {
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
