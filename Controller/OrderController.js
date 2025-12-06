const Order = require('../Models/OrderModel.js')
const Payment = require("../Models/PaymentModel.js")
const crypto = require("crypto");
const { razorpay } = require("../Config/Razorpay.js")
const mongoose = require("mongoose");

exports.createOrder = async (req, res) => {
    try {
        const { courseId, amount, userId } = req.body;

        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });

        const order = await Order.create({
            courseId,
            userId,
            amountPaid: amount,
            paymentStatus: "pending",
            status: "Pending",
            paymentIntentId: razorpayOrder.id
        });

        res.json({
            success: true,
            razorpayOrder: razorpayOrder,
            orderId: order._id,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.log("🔥 CREATE ORDER ERROR:", err.message);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getTotalRevenue = async (req, res) => {
    try {
        const result = await Order.aggregate([
            { $match: { paymentStatus: "succeeded" } },
            { $group: { _id: null, totalRevenue: { $sum: "$amountPaid" } } }
        ]);

        const total = result.length > 0 ? result[0].totalRevenue : 0;

        res.json({
            success: true,
            totalRevenue: total
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: "Error calculating total revenue" });
    }
};

exports.getCourseWiseRevenue = async (req, res) => {
    try {
        const result = await Order.aggregate([
            { $match: { paymentStatus: "succeeded" } },

            {
                $group: {
                    _id: "$courseId",
                    totalAmount: { $sum: "$amountPaid" },
                    totalStudents: { $sum: 1 }
                }
            },

            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "course"
                }
            },

            {
                $unwind: "$course"
            },

            {
                $project: {
                    _id: 0,
                    courseId: "$course._id",
                    courseName: "$course.title",
                    totalAmount: 1,
                    totalStudents: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error fetching course-wise revenue" });
    }
};

exports.getInstructorTotalRevenue = async (req, res) => {
    try {
        const instructorId = req.params.id;

        const result = await Order.aggregate([
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
                $match: { 
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId) 
                } 
            },

            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amountPaid" },
                    totalStudents: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            instructorId,
            totalRevenue: result.length ? result[0].totalRevenue : 0,
            totalStudents: result.length ? result[0].totalStudents : 0
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error calculating instructor revenue" });
    }
};

exports.getInstructorCourseWiseRevenue = async (req, res) => {
    try {
        const instructorId = req.params.id;

        const result = await Order.aggregate([
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
                $match: {
                    "course.instructorId": new mongoose.Types.ObjectId(instructorId)
                }
            },

            {
                $group: {
                    _id: "$courseId",
                    courseName: { $first: "$course.title" },
                    price: { $first: "$course.price" },
                    thumbnail: { $first: "$course.thumbnail" },
                    totalRevenue: { $sum: "$amountPaid" },
                    totalStudents: { $sum: 1 }
                }
            },

            // Sort by revenue (optional)
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json({
            success: true,
            instructorId,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching instructor coursewise revenue"
        });
    }
};
