const User = require("../Models/UserModel")
const Profile = require("../Models/ProfileModel")

const createProfile = async (req,res) => {
    try {
        const { userId, fullName, phone, gitHubUsername, bio, image } = req.body;

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingProfile = await Profile.findOne({ userId });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists. Use update instead." });
        }

        const newProfile = new Profile({
            userId,
            fullName,
            phone,
            gitHubUsername,
            bio,
            image
        });

        await newProfile.save();
        res.status(201).json({ message: "Profile created successfully", profile: newProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}


const updateProfile = async (req,res) => {
    try {
        const { userId } = req.params;
        const { fullName, phone, gitHubUsername, bio, image } = req.body;

        let profile = await Profile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found. Create it first." });
        }

        profile.fullName = fullName || profile.fullName;
        profile.phone = phone || profile.phone;
        profile.gitHubUsername = gitHubUsername || profile.gitHubUsername;
        profile.bio = bio || profile.bio;
        profile.image = image || profile.image;

        await profile.save();
        res.status(200).json({ message: "Profile updated successfully", profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

const getProfileById = async (req,res) => {
    try {
        const profile = await Profile.findOne({ userId: req.params.userId })
            .populate('userId', 'name email');
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {createProfile, updateProfile,getProfileById}