const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// @GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = { business: req.user.business._id };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); query.createdAt.$lte = e; }
    }
    const orders = await Order.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Order.countDocuments(query);
    res.json({ success: true, count: orders.length, total, orders });
  } catch (error) { next(error); }
};

// @POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { items, customer, notes, tableNumber, paymentMethod, source } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Order must have items' });

    let subtotal = 0;
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product ${item.product} not found`);
      if (!product.isAvailable) throw new Error(`${product.name} is not available`);
      const subtotalItem = product.price * item.quantity;
      subtotal += subtotalItem;
      return { product: product._id, name: product.name, price: product.price, quantity: item.quantity, subtotal: subtotalItem };
    }));

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    const order = await Order.create({
      business: req.user.business._id,
      customer, items: enrichedItems, subtotal, tax, total,
      notes, tableNumber, paymentMethod, source: source || 'walk-in'
    });

    // Update product stock & totalSold
    await Promise.all(enrichedItems.map(item =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSold: item.quantity }
      })
    ));

    await Notification.create({
      business: req.user.business._id,
      title: 'New Order',
      message: `Order ${order.orderNumber} from ${customer.name} - ₹${total}`,
      type: 'order', link: '/orders'
    });

    res.status(201).json({ success: true, order });
  } catch (error) { next(error); }
};

// @GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, business: req.user.business._id }).populate('items.product', 'name image');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

// @PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, business: req.user.business._id },
      update, { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

// @GET /api/orders/public/:businessSlug  (public order placement)
exports.publicCreateOrder = async (req, res, next) => {
  try {
    const Business = require('../models/Business');
    const business = await Business.findOne({ slug: req.params.businessSlug, isActive: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    const { items, customer, notes, tableNumber } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Order must have items' });

    let subtotal = 0;
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product || !product.isAvailable || !product.isMenuVisible) throw new Error(`${item.name || 'Product'} is not available`);
      const subtotalItem = product.price * item.quantity;
      subtotal += subtotalItem;
      return { product: product._id, name: product.name, price: product.price, quantity: item.quantity, subtotal: subtotalItem };
    }));

    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const order = await Order.create({
      business: business._id, customer, items: enrichedItems,
      subtotal, tax, total, notes, tableNumber, source: 'menu'
    });

    await Promise.all(enrichedItems.map(item =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, totalSold: item.quantity } })
    ));

    await Notification.create({
      business: business._id,
      title: 'New Online Order',
      message: `Order ${order.orderNumber} from ${customer.name} - ₹${total}`,
      type: 'order'
    });

    res.status(201).json({ success: true, message: 'Order placed!', order: { orderNumber: order.orderNumber, total, status: order.status } });
  } catch (error) { next(error); }
};

// @GET /api/orders/public/track/:orderNumber
exports.trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select('orderNumber status customer.name total createdAt items');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};
