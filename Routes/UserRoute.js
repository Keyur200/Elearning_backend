const express = require('express');
const { register, login, userdata, test, logout } = require('../Controller/UserController');
const { requireLogin } = require('../Middleware/AuthMiddleware');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // <-- Added logout route

// Protected routes
router.get('/user', requireLogin, userdata);
router.get('/test', requireLogin, test);

module.exports = router;
