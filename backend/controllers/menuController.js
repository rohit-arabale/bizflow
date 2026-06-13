const Product = require('../models/Product');
const Business = require('../models/Business');

// @GET /api/menu/:businessSlug  (public)
exports.getPublicMenu = async (req, res, next) => {
  try {
    const business = await Business.findOne({ slug: req.params.businessSlug, isActive: true })
      .select('name description type address phone settings.currency logo');
    if (!business) return res.status(404).json({ success: false, message: 'Menu not found' });

    const products = await Product.find({
      business: business._id,
      isAvailable: true,
      isMenuVisible: true
    }).select('name description category price image tags').sort({ category: 1, name: 1 });

    // Group by category
    const menu = {};
    products.forEach(p => {
      if (!menu[p.category]) menu[p.category] = [];
      menu[p.category].push(p);
    });

    res.json({ success: true, business, menu, categories: Object.keys(menu) });
  } catch (error) { next(error); }
};
