// Importa el módulo express, que es el framework principal utilizado para construir el servidor web
const express = require('express');
// Importa el módulo cors, que maneja el Intercambio de Recursos de Origen Cruzado (CORS)
const cors = require('cors');

// Crea una instancia de una aplicación Express
const app = express();

// --- Middlewares Globales ---
// Habilita CORS para todas las rutas, permitiendo que el frontend (en un puerto/dominio diferente) se comunique con esta API
app.use(cors());
// Middleware incorporado para analizar solicitudes HTTP entrantes con cargas útiles JSON (ej., desde cuerpos POST/PUT)
app.use(express.json());
// Middleware incorporado para analizar cargas útiles codificadas en URL (como envíos de formularios)
app.use(express.urlencoded({ extended: true }));

// --- Importaciones de Rutas ---
// Importa los archivos de rutas modulares para cada entidad principal de la aplicación
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const standingsRoutes = require('./routes/standingsRoutes');
const authRoutes = require('./routes/authRoutes');
const seasonRoutes = require('./routes/seasonRoutes');

// --- Rutas Base ---
// Define una ruta GET raíz simple para verificar si la API está funcionando
app.get('/', (req, res) => {
  // Responde con un mensaje de bienvenida JSON simple
  res.json({ message: 'Welcome to Youth Basketball League API' });
});

// --- Enrutamiento de la API ---
// Monta las rutas importadas en sus respectivas rutas base
// Cualquier solicitud que comience con '/api/teams' será manejada por teamRoutes
app.use('/api/teams', teamRoutes);
// Cualquier solicitud que comience con '/api/players' será manejada por playerRoutes
app.use('/api/players', playerRoutes);
// Cualquier solicitud que comience con '/api/matches' será manejada por matchRoutes
app.use('/api/matches', matchRoutes);
// Cualquier solicitud que comience con '/api/standings' será manejada por standingsRoutes
app.use('/api/standings', standingsRoutes);
// Cualquier solicitud que comience con '/api/auth' será manejada por authRoutes
app.use('/api/auth', authRoutes);
// Cualquier solicitud que comience con '/api/seasons' será manejada por seasonRoutes
app.use('/api/seasons', seasonRoutes);

// Exporta la instancia de la aplicación express completamente configurada para que pueda ser iniciada por server.js o usada en pruebas
module.exports = app;
