const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');

// Basic route to check if API is running
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Youth Basketball League API' });
});

app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);

module.exports = app;
