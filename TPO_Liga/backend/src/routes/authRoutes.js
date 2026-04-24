const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define la ruta POST para el Inicio de sesión (Login)
router.post('/login', authController.login);

module.exports = router;
