const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// @GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const bizId = req.user.business._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats
    const [todayOrders, todayRevenue, todayAppointments, monthOrders] = await Promise.all([
      Order.countDocuments({ business: bizId, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { business: bizId, createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Appointment.countDocuments({ business: bizId, date: { $gte: today, $lt: tomorrow } }),
      Order.aggregate([
        { $match: { business: bizId, createdAt: { $gte: monthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ])
    ]);

    // Revenue chart (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const rev = await Order.aggregate([
        { $match: { business: bizId, createdAt: { $gte: d, $lt: next }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]);
      last7Days.push({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: rev[0]?.total || 0,
        orders: rev[0]?.count || 0
      });
    }

    // Low stock count
    const lowStockCount = await Product.countDocuments({
      business: bizId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Recent orders
    const recentOrders = await Order.find({ business: bizId }).sort('-createdAt').limit(5);

    // Upcoming appointments
    const upcomingAppointments = await Appointment.find({
      business: bizId, date: { $gte: today }, status: { $in: ['pending', 'confirmed'] }
    }).sort({ date: 1, timeSlot: 1 }).limit(5);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { business: bizId, createdAt: { $gte: monthStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        today: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0,
          appointments: todayAppointments
        },
        month: {
          revenue: monthOrders[0]?.total || 0,
          orders: monthOrders[0]?.count || 0
        },
        inventory: { lowStockCount },
        revenueChart: last7Days,
        recentOrders,
        upcomingAppointments,
        orderStatusBreakdown
      }
    });
  } catch (error) { next(error); }
};
