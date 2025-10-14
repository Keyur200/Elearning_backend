const express = require('express');
const router = express.Router();
const {
  register,
  login,
  userdata,
  test,
  logout,
  changePassword // <-- Import the new controller
} = require('../Controller/UserController');
const { requireLogin } = require('../Middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/user', requireLogin, userdata);
router.get('/test', requireLogin, test);
router.post('/change-password', requireLogin, changePassword); // <-- Protected change password

module.exports = router;
