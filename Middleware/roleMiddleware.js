// roleMiddleware.js
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized access." });
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// Allow both Admin and Instructor
const isAdminOrInstructor = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized access." });

  if (req.user.role !== "Admin" && req.user.role !== "Instructor") {
    return res
      .status(403)
      .json({ error: "Access denied. Only Admin or Instructor allowed." });
  }
  next();
};

module.exports = { isAdmin, isAdminOrInstructor };
