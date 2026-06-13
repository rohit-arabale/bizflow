const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['shop', 'salon', 'restaurant', 'other'], required: true },
  description: { type: String },
  phone: { type: String },
  email: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  logo: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    whatsappEnabled: { type: Boolean, default: false },
    whatsappNumber: { type: String },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '21:00' },
    slotDuration: { type: Number, default: 30 }
  },
  slug: { type: String, unique: true }
}, { timestamps: true });

businessSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Business', businessSchema);
