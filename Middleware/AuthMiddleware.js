const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');
const Role = require('../Models/RoleModel');

const requireLogin = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "You must login." });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) return res.status(403).json({ error: "Invalid token." });

    const user = await User.findById(decoded._id).populate('roleId', 'name');
    if (!user) return res.status(404).json({ error: "User not found." });

    // Attach user info including role name
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId.name // role name instead of ObjectId
    };

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = { requireLogin };
