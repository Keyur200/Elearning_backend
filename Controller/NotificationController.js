const Notification = require("../Models/NotificationModel");

// GET NOTIFICATIONS BASED ON USER ROLE
exports.GetNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role.toLowerCase(); // "admin" | "instructor" | "student"

    let filter = { forRole: role };

    // Only filter by userId for non-admins
    if (role !== "admin") {
      filter.userId = userId;
    }

    const notifications = await Notification.find(filter)
      .populate({
        path: "referenceId",
        populate: { path: "videoId", select: "title courseId" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      role,
      notifications,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: err.message,
    });
  }
};

exports.DeleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
    });

    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    await Notification.findByIdAndDelete(id);

    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting notification", err });
  }
};