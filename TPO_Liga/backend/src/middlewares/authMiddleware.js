// Importa la biblioteca jsonwebtoken usada para verificar los tokens JWT
const jwt = require('jsonwebtoken');

// Exporta una función middleware de Express que toma request, response y next como argumentos
module.exports = function(req, res, next) {
  // Recupera el valor del encabezado 'Authorization' de la solicitud entrante
  const authHeader = req.header('Authorization');
  // Inicializa una variable para almacenar el token extraído
  let token;

  // Comprueba si el encabezado 'Authorization' existe y comienza con el esquema 'Bearer '
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extrae la cadena del token real dividiendo el encabezado en el espacio y tomando la segunda parte (el token en sí)
    token = authHeader.split(' ')[1];
  }

  // Si no se encontró ningún token en el encabezado, la solicitud no está autorizada
  if (!token) {
    // Devuelve un código de estado HTTP 401 Unauthorized y una respuesta JSON indicando el token faltante
    // Esto termina inmediatamente la solicitud y previene el acceso a rutas protegidas
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Intenta verificar el token extraído
  try {
    // Verifica el token usando la clave secreta almacenada en variables de entorno (process.env.JWT_SECRET)
    // La función jwt.verify() verifica sincrónicamente la firma del token y lanza un error si es inválido, expirado o manipulado
    // Si es válido, devuelve el payload decodificado del token (que contiene los datos del usuario codificados durante el inicio de sesión)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjunta los datos del payload 'admin' desde el token decodificado directamente al objeto de solicitud
    // Esto permite a los manejadores de ruta subsiguientes acceder a la información del usuario autenticado (req.admin)
    req.admin = decoded.admin;
    
    // Llama a next() para pasar el control a la siguiente función middleware o al manejador de ruta real
    next();
  } catch (err) {
    // Si jwt.verify lanza un error (ej., firma de token inválida, token expirado), atrápalo aquí
    // Devuelve un código de estado 401 Unauthorized con una respuesta JSON indicando que el token es inválido
    res.status(401).json({ message: 'Token is not valid' });
  }
};
