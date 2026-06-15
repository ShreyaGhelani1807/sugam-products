const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const ordersController = require('../controllers/ordersController');

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
});

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

router.use(authenticate);

router.post(
  '/checkout',
  orderLimiter,
  [
    body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
    body('items.*.productId').isString().notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),
  ],
  validate,
  ordersController.checkout
);

router.post(
  '/verify-payment',
  orderLimiter,
  [
    body('razorpayOrderId').isString().notEmpty(),
    body('razorpayPaymentId').isString().notEmpty(),
    body('razorpaySignature').isString().notEmpty(),
    body('internalOrderId').isString().notEmpty(),
  ],
  validate,
  ordersController.verifyPayment
);

router.get('/my', ordersController.myOrders);
router.get('/:id', ordersController.orderDetail);

module.exports = router;
