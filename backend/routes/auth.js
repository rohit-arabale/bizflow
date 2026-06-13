const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, createStaff, getStaff, deleteStaff } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/staff', protect, authorize('admin', 'superadmin'), createStaff);
router.get('/staff', protect, authorize('admin', 'superadmin'), getStaff);
router.delete('/staff/:id', protect, authorize('admin', 'superadmin'), deleteStaff);

module.exports = router;
