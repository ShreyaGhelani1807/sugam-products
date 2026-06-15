const router = require('express').Router();
const webhookController = require('../controllers/webhookController');

// Public, unauthenticated — secured by Razorpay signature verification.
router.post('/razorpay', webhookController.razorpay);

module.exports = router;
