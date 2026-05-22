// Importa la biblioteca jsonwebtoken para generar tokens JWT
const jwt = require('jsonwebtoken');
// Importa bcryptjs para verificar contraseñas hasheadas de forma segura
const bcrypt = require('bcryptjs');
// Importa el modelo de Usuario
const UserModel = require('../models/User');

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

    // Llama al Modelo para buscar el administrador por nombre de usuario
    const admin = await UserModel.findByUsername(Username);

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
