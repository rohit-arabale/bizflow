const mongoose = require('mongoose');

const chatbotRuleSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  trigger: { type: String, required: true }, // keyword or pattern
  triggerType: { type: String, enum: ['exact', 'contains', 'starts_with'], default: 'contains' },
  response: { type: String, required: true },
  category: { type: String, enum: ['greeting', 'faq', 'order', 'hours', 'location', 'custom'], default: 'custom' },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  hitCount: { type: Number, default: 0 }
}, { timestamps: true });

const chatLogSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  from: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String },
  matchedRule: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatbotRule' },
  isIncoming: { type: Boolean, default: true }
}, { timestamps: true });

const ChatbotRule = mongoose.model('ChatbotRule', chatbotRuleSchema);
const ChatLog = mongoose.model('ChatLog', chatLogSchema);

module.exports = { ChatbotRule, ChatLog };
