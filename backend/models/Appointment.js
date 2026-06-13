const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  service: { type: String, required: true },
  servicePrice: { type: Number, default: 0 },
  duration: { type: Number, default: 30 }, // minutes
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // "10:00"
  endTime: { type: String },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  notes: { type: String },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
