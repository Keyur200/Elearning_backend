const { Schema, model } = require('mongoose')

const PaymentSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending","succeeded","failed"], default: "pending" },
    transactionId: { type: String },
    receiptUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const Payment = model('Payment', PaymentSchema)
module.exports = Payment
