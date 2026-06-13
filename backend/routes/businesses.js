const express = require('express');
const router = express.Router();
const { getMyBusiness, updateBusiness, getAllBusinesses, getBySlug } = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getMyBusiness);
router.put('/my', protect, authorize('admin', 'superadmin'), updateBusiness);
router.get('/all', protect, authorize('superadmin'), getAllBusinesses);
router.get('/menu/:slug', getBySlug); // public

module.exports = router;
