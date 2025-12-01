const express = require('express');
const { UserAccess } = require('../Controller/EnrollmentController');
const router = express.Router();

router.get("/course/:id/access", UserAccess)

module.exports = router