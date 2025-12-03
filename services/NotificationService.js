// services/NotificationService.js
const Notification = require("../Models/NotificationModel");

exports.CreateNotification = async (data) => {
  try {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      referenceId: data.referenceId || null,
      message: data.message,
      forRole: data.forRole,
      isRead: false,
    });

    return notification;
  } catch (err) {
    console.error("Notification Error:", err.message);
    return null;
  }
};
