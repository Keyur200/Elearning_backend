const Enrollment = require('../Models/EnrollmentModel.js')

exports.UserAccess = async (req, res) => {
    const { userId } = req.query;  
    const courseId = req.params.id;

    const enrolled = await Enrollment.findOne({ userId, courseId });

    if (!enrolled)
        return res.json({ access: false });

    res.json({ access: true });
}

