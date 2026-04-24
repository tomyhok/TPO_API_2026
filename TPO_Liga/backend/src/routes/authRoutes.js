const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define POST route for Login
router.post('/login', authController.login);

module.exports = router;
