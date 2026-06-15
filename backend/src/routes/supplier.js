const router = require('express').Router();
const { param, body } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const supplierController = require('../controllers/supplierController');

router.use(authenticate, requireRole('supplier'));
router.get('/orders', supplierController.listOrders);
router.get('/orders/:id', [param('id').isString().notEmpty()], validate, supplierController.orderDetail);
router.patch(
  '/orders/:id/status',
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['ACCEPTED', 'DISPATCHED', 'DELIVERED']).withMessage('Invalid status'),
  ],
  validate,
  supplierController.updateStatus
);

module.exports = router;
