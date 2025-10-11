const { Schema, model } = require('mongoose')

const OrderSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: "Pending" },
    paymentIntentId: { type: String },
    paymentStatus: { type: String, enum: ["succeeded","failed","pending"], default: "pending" },
    amountPaid: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    accessGranted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const Order = model('Order', OrderSchema)
module.exports = Order
