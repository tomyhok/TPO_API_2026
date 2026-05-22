// Importa el modelo Standing
const StandingModel = require('../models/Standing');

// Exporta una función controladora asíncrona para manejar solicitudes HTTP GET para la tabla de posiciones
exports.getStandings = async (req, res) => {
  try {
    // Llama al modelo para obtener las posiciones
    const standings = await StandingModel.getStandings();

    // res.json() serializa este array en formato JSON y lo envía al cliente como el cuerpo de la respuesta
    res.json(standings);
  } catch (error) {
    // Si ocurre algún error, regístralo en consola
    console.error('Error fetching standings:', error);
    
    // Devuelve un código HTTP 500 Internal Server Error al cliente
    res.status(500).json({ message: 'Internal server error.' });
  }
};
