// Carga las variables de entorno desde el archivo .env hacia process.env al inicio del ciclo de vida de la aplicación
require('dotenv').config();
// Importa la aplicación Express configurada desde app.js
const app = require('./app');
// Importa poolPromise desde db.js para asegurar que solo iniciamos el servidor si la base de datos está accesible
const { poolPromise } = require('./config/db');

// Determina el puerto a escuchar: usa la variable de entorno PORT si está configurada, de lo contrario por defecto 3000
const PORT = process.env.PORT || 3000;

// Espera a que la promesa de conexión a la base de datos SQL se resuelva antes de iniciar el servidor HTTP
poolPromise.then(() => {
  // Una vez que la BD está conectada, instruye a la aplicación Express a comenzar a escuchar solicitudes HTTP entrantes en el puerto especificado
  app.listen(PORT, () => {
    // Registra un mensaje indicando que el servidor se está ejecutando y listo para aceptar solicitudes
    console.log(`Server is running on port ${PORT}.`);
  });
}).catch((err) => {
  // Si la promesa de conexión a la base de datos es rechazada (falla), atrapa el error aquí
  // Registra un mensaje de error fatal indicando por qué el servidor no se está iniciando
  console.error('Failed to start server due to database connection issue.', err);
});
