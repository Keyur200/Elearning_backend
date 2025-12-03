const express = require("express");
const { requireLogin } = require("../Middleware/authMiddleware");

const { GetNotifications, DeleteNotification } = require("../Controller/notificationController");

const router = express.Router();

// 🔔 Get notifications based on user role (admin / instructor / student)
router.get("/notifications", requireLogin, GetNotifications);

// ❌ Delete notification
router.delete("/notifications/:id", requireLogin, DeleteNotification);

module.exports = router;
