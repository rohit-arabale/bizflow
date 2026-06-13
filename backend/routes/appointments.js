const express = require('express');
const router = express.Router();
const {
  getAppointments, createAppointment, getAppointment, updateAppointment, deleteAppointment,
  getAvailableSlots, publicBook, publicGetSlots
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/public/:businessSlug', publicBook);
router.get('/public/slots/:businessSlug/:date', publicGetSlots);

// Protected routes
router.use(protect);
router.get('/slots/:date', getAvailableSlots);
router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').get(getAppointment).put(updateAppointment).delete(deleteAppointment);

module.exports = router;
