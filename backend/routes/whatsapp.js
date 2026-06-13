const express = require('express');
const router = express.Router();
const { getRules, createRule, updateRule, deleteRule, getLogs, handleWebhook, simulateChat, getStats } = require('../controllers/whatsappController');
const { protect } = require('../middleware/auth');

// Webhook (no auth - called by Twilio)
router.post('/webhook', handleWebhook);

router.use(protect);
router.get('/stats', getStats);
router.get('/logs', getLogs);
router.post('/simulate', simulateChat);
router.route('/rules').get(getRules).post(createRule);
router.route('/rules/:id').put(updateRule).delete(deleteRule);

module.exports = router;
