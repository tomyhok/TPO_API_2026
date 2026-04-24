// Importa el objeto 'sql' (para definir tipos de parámetros) y 'poolPromise' (para establecer conexión a la base de datos) del archivo de configuración de BD
const { sql, poolPromise } = require('../config/db');

// Exporta una función controladora asíncrona para manejar solicitudes HTTP GET para la tabla de posiciones
exports.getStandings = async (req, res) => {
  try {
    // Espera la resolución del pool de conexiones de SQL Server para asegurar que la base de datos esté lista
    const pool = await poolPromise;
    
    // Crea un nuevo objeto de solicitud desde el pool y ejecuta una consulta SQL cruda asincrónicamente
    // La consulta selecciona todas las columnas de la vista de base de datos '[v_Standings]' 
    // y ordena los resultados por la columna '[Puntos]' en orden descendente (puntos más altos primero)
    const result = await pool.request()
      .query('SELECT * FROM [v_Standings] ORDER BY [Puntos] DESC');

    // Devuelve implícitamente un código de estado HTTP 200 OK
    // La propiedad result.recordset contiene un array de objetos JavaScript que representan las filas devueltas por la consulta
    // res.json() serializa este array en formato JSON y lo envía al cliente como el cuerpo de la respuesta
    res.json(result.recordset);
  } catch (error) {
    // Si ocurre algún error durante la conexión a BD o ejecución de la consulta, atrápalo aquí
    // Registra el error en la consola para depuración y seguimiento del lado del servidor
    console.error('Error fetching standings:', error);
    
    // Devuelve un código HTTP 500 Internal Server Error al cliente
    // Envía una respuesta JSON con un mensaje de error genérico para no exponer detalles internos
    res.status(500).json({ message: 'Internal server error.' });
  }
};
