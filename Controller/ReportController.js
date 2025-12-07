const User = require('../Models/UserModel');
const Course = require('../Models/CourseModel');
const Order = require('../Models/OrderModel'); 
const Role = require('../Models/RoleModel');
const mongoose = require('mongoose');

/* =========================================================================
   🟢 SECTION 1: ADMIN DASHBOARD CONTROLLERS (Global Data)
   ========================================================================= */

// 1. Get Global Stats (Users, Instructors, Courses, Total Revenue)
exports.getDashboardStats = async (req, res) => {
    try {
        const studentRole = await Role.findOne({ name: 'User' });
        const instructorRole = await Role.findOne({ name: 'Instructor' });

        const [totalStudents, totalInstructors, totalCourses, revenueData] = await Promise.all([
            User.countDocuments({ roleId: studentRole?._id }),
            User.countDocuments({ roleId: instructorRole?._id }),
            Course.countDocuments({}),
            Order.aggregate([
                { $match: { paymentStatus: 'succeeded' } },
                { $group: { _id: null, totalRevenue: { $sum: '$amountPaid' } } }
            ])
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            data: { totalStudents, totalInstructors, totalCourses, totalRevenue }
        });
    } catch (error) {
        console.error("❌ Error fetching admin stats:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 2. Get Global Daily Sales
exports.getDailySales = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyData = await Order.aggregate([
            { $match: { paymentStatus: 'succeeded', createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 },
                    revenue: { $sum: "$amountPaid" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const formattedData = dailyData.map(item => ({
            date: item._id,
            sales: item.sales,
            revenue: item.revenue
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("❌ Error fetching daily sales:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 3. Get Global Revenue by Category
exports.getRevenueByCategory = async (req, res) => {
    try {
        const categoryData = await Order.aggregate([
            { $match: { paymentStatus: 'succeeded' } },
            {
                $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' }
            },
            { $unwind: '$course' },
            {
                $lookup: { from: 'categories', localField: 'course.categoryId', foreignField: '_id', as: 'category' }
            },
            { $unwind: '$category' },
            {
                $group: { _id: '$category.name', value: { $sum: '$amountPaid' } }
            },
            { $project: { _id: 0, name: '$_id', value: 1 } }
        ]);

        res.status(200).json({ success: true, data: categoryData });
    } catch (error) {
        console.error("❌ Error fetching category revenue:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 4. Get Recent Users (Global)
exports.getRecentUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('name email roleId createdAt')
            .populate('roleId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.roleId ? user.roleId.name : 'Unknown',
            joinDate: user.createdAt.toISOString().split('T')[0],
            status: 'Active'
        }));

        res.status(200).json({ success: true, data: formattedUsers });
    } catch (error) {
        console.error("❌ Error fetching recent users:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/* =========================================================================
   🟢 SECTION 2: INSTRUCTOR DASHBOARD CONTROLLERS (Logged-in User Only)
   ========================================================================= */

// 5. Get Instructor Stats (My Students, My Revenue, My Courses)
exports.getInstructorStats = async (req, res) => {
    try {
        // Use req.user._id from the requireLogin middleware
        const instructorId = req.user._id;

        // 1. Get total courses created by THIS instructor
        const totalCourses = await Course.countDocuments({ instructorId: instructorId });

        // 2. Get Revenue & Total Students from Orders linked to THIS instructor's courses
        const revenueStats = await Order.aggregate([
            { $match: { paymentStatus: "succeeded" } }, // Only paid orders
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            {
                // 🔥 CRITICAL: Filter only courses belonging to the logged-in instructor
                $match: {
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amountPaid" },
                    totalStudents: { $sum: 1 } // Each order is one student enrollment
                }
            }
        ]);

        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
        const totalStudents = revenueStats.length > 0 ? revenueStats[0].totalStudents : 0;

        res.json({
            success: true,
            data: {
                totalStudents,
                totalRevenue,
                totalCourses
            }
        });

    } catch (error) {
        console.error("❌ Error fetching instructor stats:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 6. Get Instructor Daily Sales (Last 7 Days)
exports.getInstructorDailySales = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "succeeded",
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            {
                // 🔥 Filter for logged-in instructor
                $match: {
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId)
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const formattedData = dailyData.map(item => ({
            date: item._id,
            sales: item.sales
        }));

        res.json({ success: true, data: formattedData });

    } catch (error) {
        console.error("❌ Error fetching instructor daily sales:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 7. Get Instructor Revenue by Course (Pie Chart Data)
exports.getInstructorCourseRevenue = async (req, res) => {
    try {
        const instructorId = req.user._id;

        const courseRevenue = await Order.aggregate([
            { $match: { paymentStatus: "succeeded" } },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },
            {
                // 🔥 Filter for logged-in instructor
                $match: {
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId)
                }
            },
            {
                $group: {
                    _id: "$course.title", // Group by Course Title
                    value: { $sum: "$amountPaid" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1
                }
            }
        ]);

        res.json({ success: true, data: courseRevenue });

    } catch (error) {
        console.error("❌ Error fetching instructor course revenue:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 8. Get Instructor's Recent Students (Table Data)
exports.getInstructorRecentStudents = async (req, res) => {
    try {
        const instructorId = req.user._id;

        const recentOrders = await Order.aggregate([
            { $match: { paymentStatus: "succeeded" } },
            
            // 1. Join Course
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            { $unwind: "$course" },

            // 2. 🔥 Filter for logged-in instructor
            {
                $match: {
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId)
                }
            },

            // 3. Sort & Limit
            { $sort: { createdAt: -1 } },
            { $limit: 5 },

            // 4. Join User (Student)
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: "$student" },

            // 5. 🟢 NEW: Join Enrollment to get Progress
            // We need to match BOTH userId and courseId
            {
                $lookup: {
                    from: "enrollments", // Ensure this matches your MongoDB collection name (usually lowercase plural)
                    let: { orderUser: "$userId", orderCourse: "$courseId" },
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $eq: ["$userId", "$$orderUser"] },
                                        { $eq: ["$courseId", "$$orderCourse"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "enrollmentData"
                }
            },
            // Unwind enrollment (preserve if missing, though it shouldn't be for paid orders)
            { 
                $unwind: {
                    path: "$enrollmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // 6. Project Final Data
            {
                $project: {
                    _id: 1,
                    studentName: "$student.name",
                    studentEmail: "$student.email",
                    courseName: "$course.title",
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: "$amountPaid",
                    // Get progress, default to 0 if enrollment not found
                    progress: { $ifNull: ["$enrollmentData.progress", 0] } 
                }
            }
        ]);

        res.json({ success: true, data: recentOrders });

    } catch (error) {
        console.error("❌ Error fetching instructor recent students:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};