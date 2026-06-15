const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

router.use(authenticate, requireRole('admin'));

const ORDER_STATUSES = ['PLACED', 'ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'];
const SAMPLE_STATUSES = ['PENDING', 'SENT', 'CLOSED'];

router.get('/analytics/overview', adminController.analyticsOverview);
router.get('/analytics/monthly', adminController.analyticsMonthly);
router.get('/analytics/products', adminController.analyticsProducts);

router.get('/orders', adminController.listOrders);
router.patch(
  '/orders/:id',
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid order status'),
    body('supplierId').optional({ nullable: true }).isString(),
  ],
  validate,
  adminController.updateOrder
);

router.get('/products', adminController.listProducts);
router.post(
  '/products',
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('unit').optional().trim().notEmpty(),
  ],
  validate,
  adminController.createProduct
);
router.patch(
  '/products/:id',
  upload.single('image'),
  [
    param('id').isString().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  ],
  validate,
  adminController.updateProduct
);
router.delete('/products/:id', [param('id').isString().notEmpty()], validate, adminController.deleteProduct);

router.get('/suppliers', adminController.listSuppliers);
router.post(
  '/suppliers',
  [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('contactName').trim().notEmpty().withMessage('Contact name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('gstin').optional({ nullable: true }).isString(),
  ],
  validate,
  adminController.createSupplier
);
router.patch(
  '/suppliers/:id',
  [
    param('id').isString().notEmpty(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim().notEmpty(),
    body('businessName').optional().trim().notEmpty(),
    body('contactName').optional().trim().notEmpty(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  adminController.updateSupplier
);
router.delete('/suppliers/:id', [param('id').isString().notEmpty()], validate, adminController.deleteSupplier);
router.post(
  '/suppliers/:id/coverage',
  [
    param('id').isString().notEmpty(),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').optional({ nullable: true }).isString(),
  ],
  validate,
  adminController.addCoverage
);
router.delete(
  '/suppliers/:id/coverage/:covId',
  [param('id').isString().notEmpty(), param('covId').isString().notEmpty()],
  validate,
  adminController.removeCoverage
);

router.get('/customers', adminController.listCustomers);

router.post('/reconcile', adminController.reconcile);

router.get('/sample-requests', adminController.listSamples);
router.patch(
  '/sample-requests/:id',
  [
    param('id').isString().notEmpty(),
    body('status').isIn(SAMPLE_STATUSES).withMessage('Invalid sample status'),
  ],
  validate,
  adminController.updateSample
);

module.exports = router;
