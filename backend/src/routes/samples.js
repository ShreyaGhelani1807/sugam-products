const router = require('express').Router();
const { body } = require('express-validator');
const samplesController = require('../controllers/samplesController');

router.post('/', [
  body('customerName').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').trim().notEmpty(),
  body('productId').notEmpty(),
  body('quantity').isInt({ min: 1 }),
], samplesController.submit);

router.post('/contact', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
], samplesController.submitContact);

module.exports = router;
