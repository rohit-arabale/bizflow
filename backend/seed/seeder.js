const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const { ChatbotRule } = require('../models/WhatsApp');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bizflow';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Business.deleteMany(), Product.deleteMany(),
    Order.deleteMany(), Appointment.deleteMany(), ChatbotRule.deleteMany()
  ]);
  console.log('Cleared existing data');

  // --- Business 1: Restaurant ---
  const restaurantBiz = await Business.create({
    name: "Spice Garden Restaurant",
    type: "restaurant",
    description: "Authentic Indian cuisine with traditional flavors",
    phone: "9876543210",
    email: "spicegarden@example.com",
    address: { street: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
    settings: { currency: "INR", openingTime: "10:00", closingTime: "22:00", slotDuration: 30 }
  });

  // --- Business 2: Salon ---
  const salonBiz = await Business.create({
    name: "Glamour Salon & Spa",
    type: "salon",
    description: "Premium beauty services for everyone",
    phone: "9812345678",
    email: "glamoursalon@example.com",
    address: { street: "45 FC Road", city: "Pune", state: "Maharashtra", pincode: "411004" },
    settings: { currency: "INR", openingTime: "09:00", closingTime: "20:00", slotDuration: 45 }
  });

  // --- Business 3: Shop ---
  const shopBiz = await Business.create({
    name: "Daily Needs Kirana Store",
    type: "shop",
    description: "Your neighbourhood grocery store",
    phone: "9823456789",
    email: "dailyneeds@example.com",
    address: { street: "7 Baner Road", city: "Pune", state: "Maharashtra", pincode: "411045" },
    settings: { currency: "INR", openingTime: "07:00", closingTime: "22:00" }
  });

  // --- Users ---
  const adminRestaurant = await User.create({
    name: "Ramesh Kumar", email: "ramesh@spicegarden.com",
    password: "password123", role: "admin", business: restaurantBiz._id, phone: "9876543210"
  });
  const adminSalon = await User.create({
    name: "Priya Sharma", email: "priya@glamoursalon.com",
    password: "password123", role: "admin", business: salonBiz._id, phone: "9812345678"
  });
  const adminShop = await User.create({
    name: "Suresh Patil", email: "suresh@dailyneeds.com",
    password: "password123", role: "admin", business: shopBiz._id, phone: "9823456789"
  });
  const staffSalon = await User.create({
    name: "Anjali Mehta", email: "anjali@glamoursalon.com",
    password: "password123", role: "staff", business: salonBiz._id, phone: "9834567890"
  });

  console.log('Users created');

  // --- Restaurant Products (Menu Items) ---
  const restaurantProducts = await Product.insertMany([
    { business: restaurantBiz._id, name: "Butter Chicken", category: "Main Course", price: 280, costPrice: 120, stock: 50, unit: "plate", description: "Creamy tomato-based chicken curry", isMenuVisible: true, totalSold: 245 },
    { business: restaurantBiz._id, name: "Paneer Tikka Masala", category: "Main Course", price: 240, costPrice: 90, stock: 50, unit: "plate", description: "Cottage cheese in spiced gravy", isMenuVisible: true, totalSold: 189 },
    { business: restaurantBiz._id, name: "Dal Makhani", category: "Main Course", price: 180, costPrice: 60, stock: 50, unit: "plate", description: "Slow cooked black lentils with butter", isMenuVisible: true, totalSold: 312 },
    { business: restaurantBiz._id, name: "Garlic Naan", category: "Breads", price: 50, costPrice: 15, stock: 100, unit: "piece", description: "Tandoor baked flatbread with garlic", isMenuVisible: true, totalSold: 520 },
    { business: restaurantBiz._id, name: "Jeera Rice", category: "Rice", price: 120, costPrice: 40, stock: 80, unit: "plate", description: "Fragrant cumin rice", isMenuVisible: true, totalSold: 280 },
    { business: restaurantBiz._id, name: "Masala Chai", category: "Beverages", price: 40, costPrice: 10, stock: 100, unit: "cup", description: "Classic Indian spiced tea", isMenuVisible: true, totalSold: 450 },
    { business: restaurantBiz._id, name: "Mango Lassi", category: "Beverages", price: 80, costPrice: 25, stock: 60, unit: "glass", description: "Chilled yogurt drink with mango", isMenuVisible: true, totalSold: 210 },
    { business: restaurantBiz._id, name: "Gulab Jamun", category: "Desserts", price: 70, costPrice: 20, stock: 40, unit: "piece (2)", description: "Soft milk-solid dumplings in sugar syrup", isMenuVisible: true, totalSold: 175 },
    { business: restaurantBiz._id, name: "Chicken Biryani", category: "Rice", price: 320, costPrice: 140, stock: 30, unit: "plate", description: "Aromatic basmati rice with spiced chicken", isMenuVisible: true, totalSold: 380, lowStockThreshold: 15 },
    { business: restaurantBiz._id, name: "Samosa (2 pcs)", category: "Starters", price: 60, costPrice: 20, stock: 80, unit: "plate", description: "Crispy pastry with spiced potato filling", isMenuVisible: true, totalSold: 290 }
  ]);

  // --- Salon Products (Services) ---
  const salonProducts = await Product.insertMany([
    { business: salonBiz._id, name: "Haircut (Men)", category: "Hair", price: 250, costPrice: 50, stock: 999, unit: "session", isMenuVisible: true, totalSold: 156 },
    { business: salonBiz._id, name: "Haircut (Women)", category: "Hair", price: 500, costPrice: 100, stock: 999, unit: "session", isMenuVisible: true, totalSold: 98 },
    { business: salonBiz._id, name: "Hair Coloring", category: "Hair", price: 1500, costPrice: 400, stock: 50, unit: "session", isMenuVisible: true, totalSold: 45, lowStockThreshold: 10 },
    { business: salonBiz._id, name: "Full Body Massage", category: "Spa", price: 1200, costPrice: 200, stock: 999, unit: "session", isMenuVisible: true, totalSold: 72 },
    { business: salonBiz._id, name: "Facial", category: "Skin", price: 800, costPrice: 150, stock: 999, unit: "session", isMenuVisible: true, totalSold: 88 },
    { business: salonBiz._id, name: "Manicure", category: "Nails", price: 400, costPrice: 80, stock: 999, unit: "session", isMenuVisible: true, totalSold: 63 },
    { business: salonBiz._id, name: "Pedicure", category: "Nails", price: 500, costPrice: 100, stock: 999, unit: "session", isMenuVisible: true, totalSold: 55 }
  ]);

  // --- Shop Products (Groceries) ---
  const shopProducts = await Product.insertMany([
    { business: shopBiz._id, name: "Aashirvaad Atta 5kg", category: "Staples", price: 245, costPrice: 210, stock: 50, unit: "bag", sku: "AATA-5KG", totalSold: 89 },
    { business: shopBiz._id, name: "Amul Full Cream Milk 1L", category: "Dairy", price: 68, costPrice: 58, stock: 40, unit: "packet", sku: "MILK-1L", totalSold: 320 },
    { business: shopBiz._id, name: "Tata Salt 1kg", category: "Staples", price: 28, costPrice: 22, stock: 100, unit: "pack", sku: "SALT-1KG", totalSold: 215 },
    { business: shopBiz._id, name: "Sunflower Oil 1L", category: "Oils", price: 145, costPrice: 125, stock: 8, unit: "bottle", sku: "OIL-1L", lowStockThreshold: 10, totalSold: 78 },
    { business: shopBiz._id, name: "Maggi Noodles 70g", category: "Instant Food", price: 15, costPrice: 11, stock: 200, unit: "pack", sku: "MAGGI-70G", totalSold: 450 },
    { business: shopBiz._id, name: "Parle-G Biscuits 800g", category: "Snacks", price: 85, costPrice: 70, stock: 60, unit: "pack", sku: "PARLE-800G", totalSold: 180 },
    { business: shopBiz._id, name: "Lifebuoy Soap 100g", category: "Personal Care", price: 42, costPrice: 34, stock: 5, unit: "bar", sku: "SOAP-100G", lowStockThreshold: 10, totalSold: 95 },
    { business: shopBiz._id, name: "Basmati Rice 5kg", category: "Staples", price: 425, costPrice: 370, stock: 25, unit: "bag", sku: "RICE-5KG", totalSold: 62 }
  ]);

  console.log('Products created');

  // --- Sample Orders for Restaurant ---
  const sampleOrders = [];
  const statuses = ['delivered', 'delivered', 'delivered', 'confirmed', 'pending'];
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(); date.setDate(date.getDate() - daysAgo);
    const items = [
      { product: restaurantProducts[0]._id, name: restaurantProducts[0].name, price: 280, quantity: 1, subtotal: 280 },
      { product: restaurantProducts[3]._id, name: restaurantProducts[3].name, price: 50, quantity: 2, subtotal: 100 }
    ];
    sampleOrders.push({
      business: restaurantBiz._id,
      orderNumber: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer: { name: `Customer ${i + 1}`, phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}` },
      items,
      subtotal: 380,
      tax: 19,
      total: 399,
      status: statuses[i % statuses.length],
      paymentStatus: i < 10 ? 'paid' : 'pending',
      createdAt: date
    });
  }
  await Order.insertMany(sampleOrders);
  console.log('Orders created');

  // --- Sample Appointments for Salon ---
  const today = new Date();
  const appointmentServices = ['Haircut (Men)', 'Facial', 'Manicure', 'Full Body Massage', 'Hair Coloring'];
  const timeSlots = ['09:00', '09:45', '10:30', '11:15', '12:00', '14:00', '15:00', '16:00'];
  const sampleAppointments = [];
  for (let i = 0; i < 10; i++) {
    const daysFromNow = i < 5 ? i : -(i - 4);
    const date = new Date(today); date.setDate(date.getDate() + daysFromNow);
    sampleAppointments.push({
      business: salonBiz._id,
      customer: { name: `Client ${i + 1}`, phone: `90${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`, email: `client${i + 1}@email.com` },
      service: appointmentServices[i % appointmentServices.length],
      servicePrice: 500 + (i * 100),
      duration: 45,
      date,
      timeSlot: timeSlots[i % timeSlots.length],
      status: i < 5 ? 'confirmed' : 'completed',
      staffName: i % 2 === 0 ? 'Priya Sharma' : 'Anjali Mehta'
    });
  }
  await Appointment.insertMany(sampleAppointments);
  console.log('Appointments created');

  // --- Default WhatsApp Rules for Restaurant ---
  await ChatbotRule.insertMany([
    {
      business: restaurantBiz._id, trigger: 'hi', triggerType: 'contains', priority: 10,
      response: "Namaste! 🙏 Welcome to Spice Garden Restaurant!\n\nHow can I help you today?\n1️⃣ View our Menu\n2️⃣ Place an Order\n3️⃣ Check Order Status\n4️⃣ Our Location & Timings\n\nReply with the option number or ask your question!",
      category: 'greeting'
    },
    {
      business: restaurantBiz._id, trigger: 'menu', triggerType: 'contains', priority: 9,
      response: "🍽️ *Spice Garden Menu Highlights*\n\n*Main Course:*\n• Butter Chicken - ₹280\n• Paneer Tikka Masala - ₹240\n• Dal Makhani - ₹180\n• Chicken Biryani - ₹320\n\n*Starters:*\n• Samosa (2 pcs) - ₹60\n\n*Beverages:*\n• Masala Chai - ₹40\n• Mango Lassi - ₹80\n\nOrder online: bit.ly/spicegarden-menu 🔗",
      category: 'faq'
    },
    {
      business: restaurantBiz._id, trigger: 'timing', triggerType: 'contains', priority: 8,
      response: "⏰ *Spice Garden Timings*\n\nWe are open:\n🕙 10:00 AM - 10:00 PM\n📅 Monday to Sunday (All days)\n\nFor reservations, call us at: 📞 9876543210",
      category: 'hours'
    },
    {
      business: restaurantBiz._id, trigger: 'location', triggerType: 'contains', priority: 8,
      response: "📍 *Our Location*\n\nSpice Garden Restaurant\n12 MG Road, Pune, Maharashtra - 411001\n\nGoogle Maps: https://maps.google.com\n\n📞 Call us: 9876543210",
      category: 'location'
    },
    {
      business: restaurantBiz._id, trigger: 'order status', triggerType: 'contains', priority: 9,
      response: "📦 *Track Your Order*\n\nTo check your order status, please share your Order Number (e.g., ORD-0001)\n\nOr call us directly: 📞 9876543210\n\nWe'll update you shortly! 🙏",
      category: 'order'
    },
    {
      business: restaurantBiz._id, trigger: 'delivery', triggerType: 'contains', priority: 7,
      response: "🛵 *Delivery Information*\n\nWe deliver within 5km radius!\n⏱️ Estimated time: 30-45 minutes\n🛒 Minimum order: ₹200\n\nOrder now from our menu and we'll deliver fresh! 🔗",
      category: 'faq'
    }
  ]);

  // --- Default WhatsApp Rules for Salon ---
  await ChatbotRule.insertMany([
    {
      business: salonBiz._id, trigger: 'hi', triggerType: 'contains', priority: 10,
      response: "Hello! 💅 Welcome to Glamour Salon & Spa!\n\nI'm your virtual assistant. How can I help?\n\n1️⃣ Book an Appointment\n2️⃣ View Services & Prices\n3️⃣ Our Timings\n4️⃣ Location",
      category: 'greeting'
    },
    {
      business: salonBiz._id, trigger: 'services', triggerType: 'contains', priority: 9,
      response: "✂️ *Our Services*\n\n*Hair:*\n• Haircut (Men) - ₹250\n• Haircut (Women) - ₹500\n• Hair Coloring - ₹1500\n\n*Spa:*\n• Full Body Massage - ₹1200\n\n*Skin:*\n• Facial - ₹800\n\n*Nails:*\n• Manicure - ₹400\n• Pedicure - ₹500\n\nBook online or call 9812345678 📞",
      category: 'faq'
    },
    {
      business: salonBiz._id, trigger: 'book', triggerType: 'contains', priority: 9,
      response: "📅 *Book an Appointment*\n\nYou can book online:\n🔗 Visit our booking page\n\nOr call us: 📞 9812345678\n\nWe're open:\n⏰ 9:00 AM - 8:00 PM\n📅 All days",
      category: 'order'
    }
  ]);

  console.log('WhatsApp rules created');
  console.log('\n✅ Seed completed successfully!\n');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Restaurant Admin: ramesh@spicegarden.com / password123');
  console.log('Salon Admin:      priya@glamoursalon.com / password123');
  console.log('Shop Admin:       suresh@dailyneeds.com / password123');
  console.log('=========================\n');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
