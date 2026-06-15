const router = require('express').Router();
const productsController = require('../controllers/productsController');

router.get('/', productsController.list);
router.get('/:slug', productsController.detail);

module.exports = router;
