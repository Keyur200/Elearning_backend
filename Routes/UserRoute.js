const express = require('express');
const router = express.Router();
const {
  register,
  login,
  userdata,
  test,
  logout,
  changePassword,
  getAllUsers,
  changeUserRole 
} = require('../Controller/UserController');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/user', requireLogin, userdata);
router.get('/test', requireLogin, test);
router.post('/change-password', requireLogin, changePassword);
router.get("/users", getAllUsers);
router.put("/change-role", requireLogin,isAdminOrInstructor,changeUserRole);

module.exports = router;
