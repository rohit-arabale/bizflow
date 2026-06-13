const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find({ business: req.user.business._id })
      .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const unreadCount = await Notification.countDocuments({ business: req.user.business._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, business: req.user.business._id }, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ business: req.user.business._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, business: req.user.business._id });
    res.json({ success: true });
  } catch (error) { next(error); }
};
