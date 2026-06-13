const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit: { type: String, default: 'piece' },
  sku: { type: String },
  image: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isMenuVisible: { type: Boolean, default: true },
  tags: [{ type: String }],
  totalSold: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
