const express = require('express');
const { register, login, userdata, test } = require('../Controller/UserController');
const { requireLogin } = require('../Middleware/AuthMiddleware');
const router = express.Router();

router.post('/register', register)
router.post('/login',login)
router.get('/user',userdata)
router.get('/test',requireLogin, test)
module.exports = router