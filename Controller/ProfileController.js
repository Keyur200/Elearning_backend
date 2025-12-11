const Profile = require("../Models/ProfileModel");

// ----------------------------
// CREATE PROFILE
// ----------------------------
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists.",
      });
    }

    const { fullName, phone, gitHubUsername, bio } = req.body;

    const profileData = {
      userId,
      fullName,
      phone,
      gitHubUsername,
      bio,
    };

    // Image upload (if file is sent)
    if (req.file) {
      profileData.image = req.file.path; // Cloudinary or local path
    }

    const newProfile = await Profile.create(profileData);

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      profile: newProfile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating profile",
      error: err.message,
    });
  }
};

// ----------------------------
// GET PROFILE (Logged-in user)
// ----------------------------
exports.getProfileById = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: err.message,
    });
  }
};

// ----------------------------
// UPDATE PROFILE
// ----------------------------
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const { fullName, phone, gitHubUsername, bio } = req.body;

    if (fullName) profile.fullName = fullName;
    if (phone) profile.phone = phone;
    if (gitHubUsername) profile.gitHubUsername = gitHubUsername;
    if (bio) profile.bio = bio;

    if (req.file) {
      profile.image = req.file.path; // new image overwrite
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: err.message,
    });
  }
};

// ----------------------------
// PUBLIC PROFILE (using userId)
// ----------------------------
exports.getProfilePublic = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Public profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching public profile",
      error: err.message,
    });
  }
};
