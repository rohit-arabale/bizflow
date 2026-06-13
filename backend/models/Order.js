const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
  subtotal: Number
});

const orderSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  orderNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String }
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'online'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  notes: { type: String },
  tableNumber: { type: String },
  source: { type: String, enum: ['menu', 'whatsapp', 'walk-in', 'phone'], default: 'menu' }
}, { timestamps: true });

const buildOrderNumber = () => {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(2, 14);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${randomSuffix}`;
};

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const Order = mongoose.model('Order');
    let candidate = buildOrderNumber();

    while (await Order.exists({ orderNumber: candidate })) {
      candidate = buildOrderNumber();
    }

    this.orderNumber = candidate;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
