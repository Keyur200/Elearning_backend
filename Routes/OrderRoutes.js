const express = require('express');
const { createOrder } = require('../Controller/OrderController');
const router = express.Router();

router.post("/createorder", createOrder)

module.exports = router