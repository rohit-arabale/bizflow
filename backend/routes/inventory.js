const express = require('express');
const router = express.Router();
const { getProducts, createProduct, getProduct, updateProduct, deleteProduct, updateStock, getAnalytics, getCategories } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/categories', getCategories);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.put('/:id/stock', updateStock);

module.exports = router;
