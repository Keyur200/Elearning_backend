const express = require('express')
const { verifyPayment } = require('../Controller/PaymentController')
const router = express.Router()

router.post("/payment", verifyPayment)

module.exports = router