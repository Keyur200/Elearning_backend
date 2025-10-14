const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel");
const Role = require("../Models/RoleModel");

// REGISTER - default role = "User"
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill up all the fields." });
    }

    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.status(400).json({ error: "Email is already used." });
    }

    // Default role = User
    const userRole = await Role.findOne({ name: "User" });
    if (!userRole) {
      return res.status(500).json({ error: "Default role not found." });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPass,
      roleId: userRole._id
    });

    return res.status(201).json({ message: "User created successfully", user: { 
      _id: user._id,
      name: user.name,
      email: user.email,
      role: userRole.name
    }});

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("roleId", "name");
    if (!user) return res.status(400).json({ error: "Email or password are incorrect." });

    const passCheck = await bcrypt.compare(password, user.password);
    if (!passCheck) return res.status(400).json({ error: "Email or password are incorrect." });

    jwt.sign(
      { _id: user._id },
      process.env.SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token, { httpOnly: true }).json({
          message: "Login successful",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.roleId.name
          },
          token
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// USERDATA - get logged in user with role name
const userdata = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.SECRET, {}, async (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const user = await User.findById(decoded._id).populate("roleId", "name");
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleId.name
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// TEST endpoint
const test = async (req, res) => {
  try {
    res.json({ message: "Yes, you are logged in" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
const logout = async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production
      sameSite: "strict",
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { token } = req.cookies;

    if (!token) return res.status(401).json({ error: "Not logged in" });
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Please provide all fields" });

    // Verify JWT
    jwt.verify(token, process.env.SECRET, {}, async (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      // Get the user
      const user = await User.findById(decoded._id);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check current password
      const passCheck = await bcrypt.compare(currentPassword, user.password);
      if (!passCheck)
        return res.status(400).json({ error: "Current password is incorrect" });

      // Hash new password
      const hashedPass = await bcrypt.hash(newPassword, 10);
      user.password = hashedPass;

      await user.save();

      res.json({ message: "Password changed successfully" });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { register, login, userdata, test, logout, changePassword };