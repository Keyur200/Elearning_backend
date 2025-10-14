const express = require('express')
const { createProfile, updateProfile, getProfileById } = require("../Controller/ProfileController")
const router = express.Router()

router.post("/profile",createProfile)
router.put("/profile/:userId",updateProfile)
router.get("/profile/:userId",getProfileById)

module.exports = router