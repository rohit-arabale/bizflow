const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Business = require('../models/Business');

// @GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    const query = { business: req.user.business._id };
    if (status) query.status = status;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    const appointments = await Appointment.find(query)
      .populate('staff', 'name')
      .sort({ date: 1, timeSlot: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Appointment.countDocuments(query);
    res.json({ success: true, count: appointments.length, total, appointments });
  } catch (error) { next(error); }
};

// @POST /api/appointments
exports.createAppointment = async (req, res, next) => {
  try {
    // Check for slot conflict
    const { date, timeSlot, staff } = req.body;
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      business: req.user.business._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $nin: ['cancelled'] },
      ...(staff && { staff })
    });
    if (conflict) return res.status(400).json({ success: false, message: 'Time slot already booked' });

    const appointment = await Appointment.create({ ...req.body, business: req.user.business._id });

    await Notification.create({
      business: req.user.business._id,
      title: 'New Appointment',
      message: `${appointment.customer.name} booked ${appointment.service} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`,
      type: 'appointment',
      link: '/appointments'
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) { next(error); }
};

// @GET /api/appointments/:id
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, business: req.user.business._id }).populate('staff', 'name');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (error) { next(error); }
};

// @PUT /api/appointments/:id
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, business: req.user.business._id },
      req.body, { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (error) { next(error); }
};

// @DELETE /api/appointments/:id
exports.deleteAppointment = async (req, res, next) => {
  try {
    await Appointment.findOneAndDelete({ _id: req.params.id, business: req.user.business._id });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) { next(error); }
};

// @GET /api/appointments/slots/:date  (get available slots)
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.params;
    const business = await Business.findById(req.user.business._id);
    const { openingTime = '09:00', closingTime = '21:00', slotDuration = 30 } = business.settings;

    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      business: req.user.business._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);

    // Generate all slots
    const allSlots = [];
    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;

    while (current < end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      const slot = `${h}:${m}`;
      allSlots.push({ time: slot, available: !bookedSlots.includes(slot) });
      current += parseInt(slotDuration);
    }

    res.json({ success: true, slots: allSlots, date });
  } catch (error) { next(error); }
};

// @POST /api/appointments/public/:businessSlug  (public booking)
exports.publicBook = async (req, res, next) => {
  try {
    const Business = require('../models/Business');
    const business = await Business.findOne({ slug: req.params.businessSlug, isActive: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    const { date, timeSlot } = req.body;
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      business: business._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $nin: ['cancelled'] }
    });
    if (conflict) return res.status(400).json({ success: false, message: 'Time slot already booked' });

    const appointment = await Appointment.create({ ...req.body, business: business._id });
    await Notification.create({
      business: business._id,
      title: 'New Online Booking',
      message: `${appointment.customer.name} booked ${appointment.service} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`,
      type: 'appointment'
    });

    res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment });
  } catch (error) { next(error); }
};

// @GET /api/appointments/public/slots/:businessSlug/:date
exports.publicGetSlots = async (req, res, next) => {
  try {
    const Business = require('../models/Business');
    const business = await Business.findOne({ slug: req.params.businessSlug, isActive: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    const { date } = req.params;
    const { openingTime = '09:00', closingTime = '21:00', slotDuration = 30 } = business.settings;

    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      business: business._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);
    const allSlots = [];
    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;

    while (current < end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      const slot = `${h}:${m}`;
      allSlots.push({ time: slot, available: !bookedSlots.includes(slot) });
      current += parseInt(slotDuration);
    }

    res.json({ success: true, slots: allSlots, businessName: business.name });
  } catch (error) { next(error); }
};
