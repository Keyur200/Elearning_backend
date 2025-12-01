const Order = require('../Models/OrderModel.js')
const Payment = require("../Models/PaymentModel.js")
const crypto = require("crypto");
const { razorpay } = require("../Config/Razorpay.js")

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