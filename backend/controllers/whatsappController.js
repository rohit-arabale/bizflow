const { ChatbotRule, ChatLog } = require('../models/WhatsApp');
const Business = require('../models/Business');

// @GET /api/whatsapp/rules
exports.getRules = async (req, res, next) => {
  try {
    const rules = await ChatbotRule.find({ business: req.user.business._id }).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, rules });
  } catch (error) { next(error); }
};

// @POST /api/whatsapp/rules
exports.createRule = async (req, res, next) => {
  try {
    const rule = await ChatbotRule.create({ ...req.body, business: req.user.business._id });
    res.status(201).json({ success: true, rule });
  } catch (error) { next(error); }
};

// @PUT /api/whatsapp/rules/:id
exports.updateRule = async (req, res, next) => {
  try {
    const rule = await ChatbotRule.findOneAndUpdate(
      { _id: req.params.id, business: req.user.business._id },
      req.body, { new: true }
    );
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, rule });
  } catch (error) { next(error); }
};

// @DELETE /api/whatsapp/rules/:id
exports.deleteRule = async (req, res, next) => {
  try {
    await ChatbotRule.findOneAndDelete({ _id: req.params.id, business: req.user.business._id });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) { next(error); }
};

// @GET /api/whatsapp/logs
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await ChatLog.find({ business: req.user.business._id })
      .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await ChatLog.countDocuments({ business: req.user.business._id });
    res.json({ success: true, logs, total });
  } catch (error) { next(error); }
};

// @POST /api/whatsapp/webhook  (Twilio webhook / simulation)
exports.handleWebhook = async (req, res, next) => {
  try {
    // Twilio sends: From, Body
    const from = req.body.From || req.body.from;
    const message = (req.body.Body || req.body.message || '').toLowerCase().trim();

    if (!from || !message) return res.status(400).send('Missing params');

    // Find business by WhatsApp number (for real Twilio) or use query param
    const businessSlug = req.query.business;
    const business = await Business.findOne(
      businessSlug ? { slug: businessSlug } : { 'settings.whatsappNumber': from.replace('whatsapp:', '') }
    );
    if (!business) return res.status(404).send('Business not found');

    // Find matching rule
    const rules = await ChatbotRule.find({ business: business._id, isActive: true }).sort({ priority: -1 });
    let reply = "Thank you for contacting us! We'll get back to you soon. 🙏";
    let matchedRule = null;

    for (const rule of rules) {
      const trigger = rule.trigger.toLowerCase();
      let match = false;
      if (rule.triggerType === 'exact') match = message === trigger;
      else if (rule.triggerType === 'contains') match = message.includes(trigger);
      else if (rule.triggerType === 'starts_with') match = message.startsWith(trigger);

      if (match) {
        reply = rule.response;
        matchedRule = rule._id;
        await ChatbotRule.findByIdAndUpdate(rule._id, { $inc: { hitCount: 1 } });
        break;
      }
    }

    // Log the chat
    await ChatLog.create({ business: business._id, from, message: req.body.Body || message, reply, matchedRule, isIncoming: true });

    // Return TwiML if Twilio, else JSON
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      res.set('Content-Type', 'text/xml');
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`);
    }

    res.json({ success: true, reply, from, message });
  } catch (error) { next(error); }
};

// @POST /api/whatsapp/simulate  (test chatbot)
exports.simulateChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const msg = (message || '').toLowerCase().trim();
    const rules = await ChatbotRule.find({ business: req.user.business._id, isActive: true }).sort({ priority: -1 });
    let reply = "Thank you for contacting us! We'll get back to you soon. 🙏";
    let matchedRule = null;

    for (const rule of rules) {
      const trigger = rule.trigger.toLowerCase();
      let match = false;
      if (rule.triggerType === 'exact') match = msg === trigger;
      else if (rule.triggerType === 'contains') match = msg.includes(trigger);
      else if (rule.triggerType === 'starts_with') match = msg.startsWith(trigger);
      if (match) { reply = rule.response; matchedRule = rule; break; }
    }

    res.json({ success: true, message, reply, matchedRule });
  } catch (error) { next(error); }
};

// @GET /api/whatsapp/stats
exports.getStats = async (req, res, next) => {
  try {
    const bizId = req.user.business._id;
    const totalLogs = await ChatLog.countDocuments({ business: bizId });
    const totalRules = await ChatbotRule.countDocuments({ business: bizId, isActive: true });
    const topRules = await ChatbotRule.find({ business: bizId }).sort('-hitCount').limit(5);
    const recentLogs = await ChatLog.find({ business: bizId }).sort('-createdAt').limit(10);
    res.json({ success: true, stats: { totalLogs, totalRules, topRules, recentLogs } });
  } catch (error) { next(error); }
};
