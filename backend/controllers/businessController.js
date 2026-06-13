const Business = require('../models/Business');

// @GET /api/businesses/my
exports.getMyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business._id);
    res.json({ success: true, business });
  } catch (error) { next(error); }
};

// @PUT /api/businesses/my
exports.updateBusiness = async (req, res, next) => {
  try {
    const { name, description, phone, email, address, settings } = req.body;
    const business = await Business.findByIdAndUpdate(
      req.user.business._id,
      { name, description, phone, email, address, settings },
      { new: true, runValidators: true }
    );
    res.json({ success: true, business });
  } catch (error) { next(error); }
};

// @GET /api/businesses/all  (superadmin)
exports.getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().sort('-createdAt');
    res.json({ success: true, count: businesses.length, businesses });
  } catch (error) { next(error); }
};

// @GET /api/businesses/menu/:slug  (public)
exports.getBySlug = async (req, res, next) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug, isActive: true }).select('-settings.whatsappEnabled');
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, business });
  } catch (error) { next(error); }
};
