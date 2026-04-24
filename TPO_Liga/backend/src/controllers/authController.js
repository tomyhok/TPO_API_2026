// Importa la biblioteca jsonwebtoken para generar tokens JWT
const jwt = require('jsonwebtoken');
// Importa bcryptjs para verificar contraseñas hasheadas de forma segura
const bcrypt = require('bcryptjs');
// Importa el objeto SQL y el pool de conexiones a la base de datos desde la configuración de la BD
const { sql, poolPromise } = require('../config/db');

// Exporta una función controladora asincrónica de inicio de sesión para manejar solicitudes de autenticación
exports.login = async (req, res) => {
  try {
    // Desestructura el Nombre de Usuario y Contraseña del cuerpo de la solicitud enviado por el cliente
    const { Username, Password } = req.body;

    // Valida que ambos campos hayan sido proporcionados
    if (!Username || !Password) {
      // Si falta alguno, devuelve un 400 Bad Request con un mensaje de error
      return res.status(400).json({ message: 'Username and Password are required.' });
    }

    // Espera el pool de conexiones a la base de datos para asegurar que esté listo
    const pool = await poolPromise;
    // Crea un nuevo objeto de solicitud para ejecutar una consulta contra la BD
    const result = await pool.request()
      // Vincula el parámetro Nombre de Usuario para prevenir ataques de inyección SQL
      .input('Username', sql.NVarChar, Username)
      // Ejecuta una consulta SELECT para encontrar el usuario administrador con el nombre de usuario proporcionado
      .query('SELECT * FROM Administrators WHERE Username = @Username');

    // Extrae la primera fila coincidente del conjunto de resultados
    const admin = result.recordset[0];

    // Si no se encuentra ningún usuario administrador con ese nombre de usuario
    if (!admin) {
      // Devuelve un estado 401 Unauthorized con un mensaje genérico (previene la enumeración de nombres de usuario)
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Usa bcrypt para comparar la contraseña en texto plano enviada por el cliente 
    // contra la contraseña hasheada almacenada en la base de datos
    const isMatch = await bcrypt.compare(Password, admin.PasswordHash);

    // Si las contraseñas no coinciden
    if (!isMatch) {
      // Devuelve un estado 401 Unauthorized
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Crea un objeto payload que se integrará dentro del token JWT
    const payload = {
      admin: {
        id: admin.AdminID,
        username: admin.Username
      }
    };

    // Firma asincrónicamente y genera el token JWT usando la clave secreta
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // La clave secreta usada para firmar el token desde variables de entorno
      { expiresIn: '1h' }, // Establece que el token expire en 1 hora por seguridad
      (err, token) => {
        // Si ocurre un error durante la firma, lánzalo para que sea atrapado por el bloque catch
        if (err) throw err;
        // Si tiene éxito, devuelve el token generado en una respuesta JSON
        res.json({ token });
      }
    );
  } catch (error) {
    // Registra cualquier error inesperado (ej., problema de conexión a la BD) en la consola del servidor
    console.error('Login error:', error);
    // Devuelve un estado genérico 500 Internal Server Error
    res.status(500).json({ message: 'Server error' });
  }
};
