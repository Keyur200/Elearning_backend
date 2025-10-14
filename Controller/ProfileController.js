const User = require("../Models/UserModel");
const Profile = require("../Models/ProfileModel");
const cloudinary = require("cloudinary").v2;

// ✅ Create Profile
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from token
    const { fullName, phone, gitHubUsername, bio, imageUrl } = req.body;

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists. Use update instead." });
    }

    // Handle image upload
    let finalImage;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "profiles",
        resource_type: "image",
      });
      finalImage = uploadResult.secure_url;
    } else if (imageUrl) {
      finalImage = imageUrl;
    }

    const newProfile = new Profile({
      userId,
      fullName,
      phone,
      gitHubUsername,
      bio,
      image: finalImage,
    });

    await newProfile.save();
    res.status(201).json({ message: "Profile created successfully", profile: newProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from token
    const { fullName, phone, gitHubUsername, bio, imageUrl } = req.body;

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found. Create it first." });
    }

    // Handle image upload
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "profiles",
        resource_type: "image",
      });
      profile.image = uploadResult.secure_url;
    } else if (imageUrl) {
      profile.image = imageUrl;
    }

    profile.fullName = fullName || profile.fullName;
    profile.phone = phone || profile.phone;
    profile.gitHubUsername = gitHubUsername || profile.gitHubUsername;
    profile.bio = bio || profile.bio;

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Profile
exports.getProfileById = async (req, res) => {
  try {
    const userId = req.user._id; // from token
    const profile = await Profile.findOne({ userId }).populate("userId", "name email");
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
