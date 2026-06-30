const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// Creamos la cadena de conexión para Windows Authentication con ODBC Driver 17
const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'YouthBasketballLeague'};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;

const config = {
  connectionString: connectionString
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
