const Enrollment = require("../Models/EnrollmentModel.js");
const Order = require("../Models/OrderModel.js");
const Payment = require("../Models/PaymentModel.js");
const crypto = require("crypto");
console.log(process.env.RAZORPAY_KEY_SECRET)

exports.verifyPayment = async (req, res) => {
    try {
        const { 
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Step 1: Verify Razorpay HMAC signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (expectedSign !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // Step 2: Update Order in database
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: "succeeded",
                status: "Completed",
                accessGranted: true
            },
            { new: true }
        );

        // Step 3: Create Payment record
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

        // Step 4: ⚡ Enroll user into course (IF NOT already enrolled)
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

        res.json({ success: true, message: "Payment verified & user enrolled" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Verification failed" });
    }
};
