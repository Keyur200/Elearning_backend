const express = require('express');
const { register, login, userdata, test } = require('../Controller/UserController');
const { requireLogin } = require('../Middleware/AuthMiddleware');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/user', requireLogin, userdata);
router.get('/test', requireLogin, test);

module.exports = router;
