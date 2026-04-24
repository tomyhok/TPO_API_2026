// Carga las variables de entorno para asegurar que la lógica de conexión a la base de datos tenga acceso a DB_SERVER, DB_NAME, etc.
require('dotenv').config();
// Importa bcryptjs, una biblioteca usada para hashear contraseñas de forma segura
const bcrypt = require('bcryptjs');
// Importa el objeto sql y la promesa del pool de conexiones a la base de datos desde la configuración de la BD
const { sql, poolPromise } = require('../config/db');

// Define una función asincrónica para manejar la lógica de inicialización (seeding)
async function seedAdmin() {
  try {
    // Define la contraseña en texto plano y el nombre de usuario para la cuenta de administrador por defecto
    const password = 'TPO_Admin_2026';
    const username = 'admin';

    // --- Hashear la contraseña ---
    // Genera un salt con un factor de costo de 10. Un salt agrega datos aleatorios al proceso de hashing para proteger contra ataques de tablas arcoíris.
    const salt = await bcrypt.genSalt(10);
    // Hashea la contraseña en texto plano usando el salt generado
    const passwordHash = await bcrypt.hash(password, salt);

    // --- Conectar a la BD e insertar ---
    // Espera la resolución del pool de conexiones a la base de datos
    const pool = await poolPromise;
    // Crea un nuevo objeto de solicitud desde el pool de conexiones
    const result = await pool.request()
      // Vincula el nombre de usuario como un parámetro NVarChar para prevenir inyección SQL
      .input('Username', sql.NVarChar, username)
      // Vincula la contraseña hasheada de forma segura como un parámetro NVarChar
      .input('PasswordHash', sql.NVarChar, passwordHash)
      // Ejecuta la consulta INSERT para agregar el nuevo administrador a la tabla de la base de datos
      .query('INSERT INTO Administrators (Username, PasswordHash) VALUES (@Username, @PasswordHash)');

    // Registra un mensaje de éxito en la consola
    console.log('Admin user seeded successfully!');
    // Sale del script exitosamente (código de estado 0)
    process.exit(0);
  } catch (error) {
    // Si ocurre algún error (ej., problema de conexión a la BD, la tabla no existe), atrápalo y regístralo
    console.error('Error seeding admin user:', error);
    // Sale del script con un código de error (1)
    process.exit(1);
  }
}

// Llama a la función asincrónica para ejecutar la operación de inicialización
seedAdmin();
