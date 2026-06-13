const Product = require('../models/Product');
const Notification = require('../models/Notification');

// @GET /api/inventory
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, available, page = 1, limit = 50 } = req.query;
    const query = { business: req.user.business._id };
    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === 'true';
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }];

    const products = await Product.find(query)
      .sort({ category: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Product.countDocuments(query);

    res.json({ success: true, count: products.length, total, products });
  } catch (error) { next(error); }
};

// @POST /api/inventory
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, business: req.user.business._id });
    if (product.stock <= product.lowStockThreshold) {
      await Notification.create({
        business: req.user.business._id,
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.stock} units left`,
        type: 'inventory'
      });
    }
    res.status(201).json({ success: true, product });
  } catch (error) { next(error); }
};

// @GET /api/inventory/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, business: req.user.business._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

// @PUT /api/inventory/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user.business._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.stock <= product.lowStockThreshold) {
      await Notification.create({
        business: req.user.business._id,
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.stock} units left`,
        type: 'inventory'
      });
    }
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

// @DELETE /api/inventory/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, business: req.user.business._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};

// @PUT /api/inventory/:id/stock
exports.updateStock = async (req, res, next) => {
  try {
    const { adjustment, type } = req.body; // type: 'set' | 'add' | 'subtract'
    const product = await Product.findOne({ _id: req.params.id, business: req.user.business._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (type === 'set') product.stock = adjustment;
    else if (type === 'add') product.stock += adjustment;
    else if (type === 'subtract') product.stock = Math.max(0, product.stock - adjustment);

    await product.save();

    if (product.stock <= product.lowStockThreshold) {
      await Notification.create({
        business: req.user.business._id,
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.stock} units left`,
        type: 'inventory'
      });
    }
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

// @GET /api/inventory/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const bizId = req.user.business._id;
    const totalProducts = await Product.countDocuments({ business: bizId });
    const lowStockProducts = await Product.find({ business: bizId, $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
    const outOfStock = await Product.countDocuments({ business: bizId, stock: 0 });
    const topSelling = await Product.find({ business: bizId }).sort('-totalSold').limit(5);
    const categories = await Product.aggregate([
      { $match: { business: bizId } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
    ]);
    const inventoryValue = await Product.aggregate([
      { $match: { business: bizId } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$costPrice'] } } } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        outOfStock,
        topSelling,
        categories,
        inventoryValue: inventoryValue[0]?.total || 0
      }
    });
  } catch (error) { next(error); }
};

// @GET /api/inventory/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { business: req.user.business._id });
    res.json({ success: true, categories });
  } catch (error) { next(error); }
};
