// Importa la biblioteca mssql configurada con el controlador msnodesqlv8 para soporte nativo de SQL Server (permite Autenticación de Windows)
const sql = require('mssql/msnodesqlv8');
// Carga las variables de entorno desde el archivo .env hacia process.env
require('dotenv').config();

// Define el objeto de configuración para el pool de conexiones de SQL Server
const config = {
  // Usa una cadena de conexión porque msnodesqlv8 la requiere para la Autenticación de Windows
  // Construye dinámicamente la cadena usando DB_SERVER y DB_NAME desde .env, o valores por defecto si no se proporcionan
  // Trusted_Connection=yes indica que se usa la Autenticación de Windows
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'YouthBasketballLeague'};Trusted_Connection=yes;`
};

// Crea una nueva instancia de ConnectionPool con la configuración e intenta conectarse inmediatamente
const poolPromise = new sql.ConnectionPool(config)
  .connect() // .connect() devuelve una promesa que se resuelve cuando la conexión se establece
  .then(pool => {
    // Si la conexión es exitosa, registra un mensaje de éxito en la consola
    console.log('Connected to SQL Server successfully using Windows Authentication!');
    // Devuelve el objeto pool conectado para que pueda ser usado por otras partes de la aplicación
    return pool;
  })
  .catch(err => {
    // Si la conexión falla (ej., credenciales incorrectas, base de datos caída), registra un mensaje de error con detalles
    console.error('Database Connection Failed! Please check your credentials.', err);
    // Sale del proceso Node.js con un código de falla (1) porque la aplicación no puede funcionar sin una base de datos
    process.exit(1);
  });

// Exporta el módulo 'sql' (útil para acceder a tipos de datos como sql.Int) y 'poolPromise'
module.exports = {
  sql,
  poolPromise
};
