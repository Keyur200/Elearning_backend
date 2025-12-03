const Enrollment = require("../Models/EnrollmentModel.js");
const Order = require("../Models/OrderModel.js");
const Payment = require("../Models/PaymentModel.js");
const Notification = require("../Models/NotificationModel.js");
const Course = require("../Models/CourseModel.js");
const crypto = require("crypto");

exports.verifyPayment = async (req, res) => {
    try {
        const { 
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // 1️⃣ Verify Razorpay signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (expectedSign !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // 2️⃣ Update the Order
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: "succeeded",
                status: "Completed",
                accessGranted: true
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 3️⃣ Create Payment Record
        await Payment.create({
            orderId: order._id,
            userId: order.userId,
            courseId: order.courseId,
            paymentMethod: "Razorpay",
            amount: order.amountPaid,
            currency: "INR",
            status: "succeeded",
            transactionId: razorpay_payment_id
        });

        // 4️⃣ Enroll user (avoid duplicate enrollment)
        const alreadyEnrolled = await Enrollment.findOne({
            userId: order.userId,
            courseId: order.courseId
        });

        if (!alreadyEnrolled) {
            await Enrollment.create({
                userId: order.userId,
                courseId: order.courseId
            });
        }

        // 5️⃣ 📢 Notify Instructor About New Enrollment
        const course = await Course.findById(order.courseId).populate("instructorId");

        if (course && course.instructorId) {
            await Notification.create({
                userId: course.instructorId._id,
                type: "new_enrollment",
                referenceId: order._id,
                message: `A new student enrolled in your course: ${course.title}`,
                forRole: "instructor",
                isRead: false
            });
        }

        res.json({
            success: true,
            message: "Payment verified, user enrolled & instructor notified"
        });

    } catch (err) {
        console.log("❌ VERIFY PAYMENT ERROR:", err);
        res.status(500).json({ error: "Verification failed" });
    }
};
