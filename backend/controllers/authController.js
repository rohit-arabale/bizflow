const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, businessName, businessType } = req.body;
    if (!name || !email || !password || !businessName || !businessType) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Create business
    const business = await Business.create({
      name: businessName,
      type: businessType,
      email,
      phone
    });

    // Create admin user
    const user = await User.create({ name, email, password, phone, role: 'admin', business: business._id });

    const token = generateToken(user._id);
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, business }
    });
  } catch (error) { next(error); }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).populate('business');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, business: user.business, phone: user.phone }
    });
  } catch (error) { next(error); }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('business');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// @PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// @POST /api/auth/staff  (admin creates staff)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const staff = await User.create({ name, email, password, phone, role: 'staff', business: req.user.business._id });
    res.status(201).json({ success: true, message: 'Staff created', user: { id: staff._id, name: staff.name, email: staff.email, role: staff.role } });
  } catch (error) { next(error); }
};

// @GET /api/auth/staff
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ business: req.user.business._id, role: 'staff' }).select('-password');
    res.json({ success: true, staff });
  } catch (error) { next(error); }
};

// @DELETE /api/auth/staff/:id
exports.deleteStaff = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (error) { next(error); }
};
